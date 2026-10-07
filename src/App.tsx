import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { BaselineDiff } from "./pages/BaselineDiff";
import { BaselineManager } from "./pages/BaselineManager";
import { EvalOverview } from "./pages/EvalOverview";
import { ReportDetail } from "./pages/ReportDetail";
import { ReportList } from "./pages/ReportList";
import { SkillEvalDetail } from "./pages/SkillEvalDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/eval" replace />} />
        <Route path="/eval/baseline/diff" element={<BaselineDiff />} />
        <Route path="/eval/baseline" element={<BaselineManager />} />
        <Route path="/eval/reports/:reportId" element={<ReportDetail />} />
        <Route path="/eval/reports" element={<ReportList />} />
        <Route path="/eval/:skillId" element={<SkillEvalDetail />} />
        <Route path="/eval" element={<EvalOverview />} />
      </Route>
    </Routes>
  );
}
