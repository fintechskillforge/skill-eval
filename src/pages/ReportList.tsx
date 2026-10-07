import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { decisionLabel, formatDay, formatTime, percent } from "../lib/format";
import { reportOf, reports, skills } from "../mock/eval-results";
import { METRIC_KEYS, METRIC_LABELS } from "../types/eval";
import type { PublishDecision } from "../types/eval";

function downloadReport(reportId: string) {
  const report = reportOf(reportId);
  if (!report) return;
  const body = METRIC_KEYS.map((key) => {
    const metric = report.metrics[key];
    return `| ${METRIC_LABELS[key]} | ${metric.detail} | ${metric.passed ? "通过" : "不通过"} |`;
  }).join("\n");
  const blob = new Blob(
    [`# ${report.skillName} ${report.version}\n\n${formatTime(report.evaluatedAt)}\n\n| 指标 | 明细 | 状态 |\n|:---|:---|:---|\n${body}\n`],
    { type: "text/markdown;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.id}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportList() {
  const [skillId, setSkillId] = useState("all");
  const [status, setStatus] = useState<"all" | PublishDecision>("all");
  const [from, setFrom] = useState("2026-09-30");
  const [to, setTo] = useState("2026-10-06");
  const visible = useMemo(
    () =>
      [...reports].reverse().filter((item) => {
        const day = item.evaluatedAt.slice(0, 10);
        if (skillId !== "all" && item.skillId !== skillId) return false;
        if (status !== "all" && item.publishDecision !== status) return false;
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      }),
    [skillId, status, from, to],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold">评测报告</h1>
      <div className="flex flex-wrap gap-3 rounded-lg border border-line bg-white p-4 shadow-card">
        <select aria-label="按技能筛选" value={skillId} onChange={(event) => setSkillId(event.target.value)} className="rounded-[6px] border border-line px-2 py-1 text-sm">
          <option value="all">全部技能</option>
          {skills.map((skill) => (
            <option key={skill.skillId} value={skill.skillId}>
              {skill.skillName}
            </option>
          ))}
        </select>
        <select aria-label="按状态筛选" value={status} onChange={(event) => setStatus(event.target.value as "all" | PublishDecision)} className="rounded-[6px] border border-line px-2 py-1 text-sm">
          <option value="all">全部状态</option>
          <option value="allow">通过</option>
          <option value="block">阻断</option>
          <option value="rollback">回退</option>
        </select>
        <label className="text-sm">
          从
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="ml-2 rounded-[6px] border border-line px-2 py-1" />
        </label>
        <label className="text-sm">
          到
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="ml-2 rounded-[6px] border border-line px-2 py-1" />
        </label>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-card">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              {["技能", "版本", "评测时间", "状态", "四项得分", "操作"].map((head) => (
                <th key={head} className="px-4 py-3 font-normal">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id} className="border-b border-[#F0F0F0]">
                <td className="px-4 py-3">{item.skillName}</td>
                <td className="px-4 py-3">{item.version}</td>
                <td className="px-4 py-3">{formatTime(item.evaluatedAt)}</td>
                <td className="px-4 py-3">{item.overallPassed ? "✅" : "❌"} {decisionLabel(item.publishDecision)}</td>
                <td className="px-4 py-3 text-xs">
                  {METRIC_KEYS.map((key) => (
                    <span key={key} className="mr-3">
                      {METRIC_LABELS[key].slice(0, 2)} {percent(item.metrics[key].score)}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <Link className="text-primary" to={`/eval/reports/${item.id}`}>查看</Link>
                  <span className="mx-2 text-muted">/</span>
                  <button type="button" className="text-primary" onClick={() => downloadReport(item.id)}>
                    下载
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="py-6 text-center text-sm text-muted">这个范围里没有报告。当前样本从 {formatDay("2026-09-30T00:00:00Z")} 到 2026-10-06。</p>}
      </div>
    </div>
  );
}
