import numpy as np
import pandas as pd

SENSORS = ["volt", "rotate", "pressure", "vibration"]
ERR_TYPES = ["error1", "error2", "error3", "error4", "error5"]
WINDOWS = [3, 6, 12, 24, 48, 168]
COMPONENTS = ["comp1", "comp2", "comp3", "comp4"]
H_NS = 3_600_000_000_000  # one hour in ns


class FeatureStore:
    """Pre-indexes the raw tables once, then builds the latest feature row at any time T."""

    def __init__(self, data, cfg):
        self.features = cfg["features"]
        tel = data["telemetry"].sort_values(["machineID", "datetime"])
        self.t, self.v = {}, {}
        for m, g in tel.groupby("machineID"):
            self.t[m] = g["datetime"].to_numpy("datetime64[ns]").astype("int64")
            self.v[m] = g[SENSORS].to_numpy(float)
        self.err = {}
        for m, g in data["errors"].sort_values("datetime").groupby("machineID"):
            self.err[m] = {
                e: gg["datetime"].to_numpy("datetime64[ns]").astype("int64")
                for e, gg in g.groupby("errorID")
            }
        self.mnt = {}
        for (m, c), g in data["maintenance"].groupby(["machineID", "comp"]):
            self.mnt[(m, c)] = np.sort(g["datetime"].to_numpy("datetime64[ns]").astype("int64"))
        self.meta = data["machines"].set_index("machineID")
        self.last_time = max(arr[-1] for arr in self.t.values())

    @staticmethod
    def _roll(v, n, w):
        if n < w:
            return np.nan, np.nan, np.nan, np.nan
        s = v[n - w:n]
        return s.mean(), s.std(ddof=1) if w > 1 else np.nan, s.max(), s.min()

    def row(self, m, T_ns):
        times = self.t[m]
        n = int(np.searchsorted(times, T_ns, side="right"))
        if n == 0:
            return None
        T = times[n - 1]
        f = {}
        for si, s in enumerate(SENSORS):
            v = self.v[m][:, si]
            f[s] = v[n - 1]
            st = {w: self._roll(v, n, w) for w in WINDOWS}
            for w in WINDOWS:
                f[f"{s}_mean_{w}"], f[f"{s}_std_{w}"] = st[w][0], st[w][1]
            f[f"{s}_max_24"], f[f"{s}_min_24"] = st[24][2], st[24][3]
            f[f"{s}_diff_3"] = v[n - 1] - v[n - 4] if n >= 4 else np.nan
            f[f"{s}_diff_24"] = v[n - 1] - v[n - 25] if n >= 25 else np.nan
            f[f"{s}_z24_vs168"] = (st[24][0] - st[168][0]) / (st[168][1] + 1e-6)
            f[f"{s}_z3_vs168"] = (st[3][0] - st[168][0]) / (st[168][1] + 1e-6)
            f[f"{s}_std_ratio_24_168"] = st[24][1] / (st[168][1] + 1e-6)
        e_all = self.err.get(m, {})
        for e in ERR_TYPES:
            ts = e_all.get(e, np.array([], dtype="int64"))
            ts = ts[ts <= T]
            for w in (24, 72, 168):
                f[f"{e}_cnt_{w}"] = float((ts > T - w * H_NS).sum())
            f[f"{e}_hrs_since"] = (T - ts[-1]) / H_NS if len(ts) else np.nan
        f["err_total_24"] = sum(f[f"{e}_cnt_24"] for e in ERR_TYPES)
        f["err_total_168"] = sum(f[f"{e}_cnt_168"] for e in ERR_TYPES)
        for c in COMPONENTS:
            ev = self.mnt.get((m, c), np.array([], dtype="int64"))
            k = int(np.searchsorted(ev, T, side="right"))
            f[f"{c}_hrs_since_maint"] = (T - ev[k - 1]) / H_NS if k > 0 else np.nan
            f[f"{c}_n_replacements"] = k
        f["model"] = int(str(self.meta.loc[m, "model"]).replace("model", ""))
        f["age"] = self.meta.loc[m, "age"]
        return f

    def matrix(self, as_of=None):
        T_ns = self.last_time if as_of is None else pd.Timestamp(as_of).value
        rows, ids = [], []
        for m in self.t:
            r = self.row(m, T_ns)
            if r is not None:
                rows.append([r[c] for c in self.features]); ids.append(m)
        X = pd.DataFrame(rows, columns=self.features, index=pd.Index(ids, name="machineID"))
        return X.astype(np.float32)