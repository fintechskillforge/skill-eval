import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CaseInspect } from "../components/CaseInspect";
import { CaseTable } from "../components/CaseTable";
import { FailedCaseList } from "../components/FailedCaseList";
import { MetricCard } from "../components/MetricCard";
import { formatTime, skillTypeLabel } from "../lib/format";
import { casesFor } from "../mock/cases";
import { versionOf, evalBaselines } from "../mock/eval-baselines";
import { latestOf, skills } from "../mock/eval-results";
import { METRIC_KEYS } from "../types/eval";

export function SkillEvalDetail() {
  const { skillId = "" } = useParams();
  const skill = skills.find((item) => item.skillId === skillId);
  const latest = latestOf(skillId);
  const [openId, setOpenId] = useState("");
  if (!skill) return <p className="text-sm">没有这个技能。</p>;

  const rows = latest ? casesFor(latest.id) : [];
  const openCase = (caseId: string) => {
    setOpenId(caseId);
    window.setTimeout(() => {
      document.getElementById(`failed-${caseId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold">{skill.skillName}</h1>
        <p className="mt-2 text-sm text-muted">
          {skill.skillId} · {skill.version} · {skillTypeLabel(skill.skillType)} · 负责人 {skill.owner}
          {latest ? ` · 最近评测 ${formatTime(latest.evaluatedAt)}` : " · 尚未评测"}
        </p>
      </div>
      {!latest && (
        <section className="rounded-lg border border-line bg-white p-4 shadow-card">
          <p className="text-sm">这个技能还在目录里，没有门禁结果。接入 baselineRefs 并跑执行器之后，这里才会有指标。</p>
        </section>
      )}
      {latest && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {METRIC_KEYS.map((key) => (
              <MetricCard key={key} metricKey={key} {...latest.metrics[key]} />
            ))}
          </section>
          <section className="rounded-lg border border-line bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold">评测基准依赖</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {latest.baselineRefs.map((ref) => {
                const [id, version] = ref.split("@");
                const doc = evalBaselines[id];
                const current = doc ? versionOf(doc, version) : undefined;
                return (
                  <li key={ref} className="flex flex-wrap gap-3 border-b border-[#F0F0F0] py-2">
                    <Link className="text-primary" to="/eval/baseline">
                      {ref}
                    </Link>
                    <span className="text-xs text-muted">生效 {current?.effectiveFrom || "—"}</span>
                  </li>
                );
              })}
            </ul>
          </section>
          <CaseTable rows={rows} onOpen={openCase} />
          <CaseInspect row={rows.find((item) => item.caseId === openId)} />
          <FailedCaseList rows={rows} openId={openId} onOpen={setOpenId} />
          <p className="text-xs text-muted">
            完整报告：
            <Link className="ml-2 text-primary" to={`/eval/reports/${latest.id}`}>
              {latest.id}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
