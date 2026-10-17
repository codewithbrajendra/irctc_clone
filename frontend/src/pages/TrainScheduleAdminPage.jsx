import AdminResourcePage from "./AdminResourcePage.jsx";
import CoachInventoryPanel from "../components/CoachInventoryPanel.jsx";

export default function TrainScheduleAdminPage() {
  return <div className="page-stack"><AdminResourcePage kind="schedules"/><CoachInventoryPanel/></div>;
}
