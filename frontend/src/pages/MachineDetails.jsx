import { useParams, useNavigate } from "react-router-dom";

export default function MachineDetails() {
  const { machineId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button onClick={() => navigate("/")}>← Back to Dashboard</button>
      <h1 className="text-2xl font-bold mt-6">Machine {machineId}</h1>
      <p>Loading machine details...</p>
    </div>
  );
}