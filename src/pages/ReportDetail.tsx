import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CaseInspect } from "../components/CaseInspect";
import { CaseTable } from "../components/CaseTable";
import { FailedCaseList } from "../components/FailedCaseList";
import { MetricCard } from "../components/MetricCard";
import { decisionLabel, formatTime, skillTypeLabel } from "../lib/format";
import { casesFor } from "../mock/cases";
import { reportOf } from "../mock/eval-results";
import { METRIC_KEYS, METRIC_LABELS } from "../types/eval";

function toMarkdown(reportId: string) {
  const report = reportOf(reportId);
  if (!report) return "";
  const rows = METRIC_KEYS.map((key) => {
    const metric = report.metrics[key];
    return `| ${METRIC_LABELS[key]} | ${metric.detail} | ${metric.passed ? "通过" : "不通过"} |`;
  }).join("\n");
  return `# Eval 评测报告\n\n**Skill**: ${report.skillName}\n**版本**: ${report.version}\n**评测时间**: ${formatTime(report.evaluatedAt)}\n\n| 指标 | 明细 | 状态 |\n|:---|:---|:---|\n${rows}\n\n发布建议：${decisionLabel(report.publishDecision)}\n`;
}

export function ReportDetail() {
  const { reportId = "" } = useParams();
  const report = reportOf(reportId);
  const [openId, setOpenId] = useState("");
  const [copied, setCopied] = useState(false);
  if (!report) return <p className="text-sm">没有这份报告。</p>;
  const rows = casesFor(report.id);
  const advice =
    report.publishDecision === "allow"
      ? "✅ 通过，允许发布。"
      : report.publishDecision === "block"
        ? "❌ 不通过，阻断发布。"
        : "🔄 回退上一已登记版本。";

  const download = () => {
    const blob = new Blob([toMarkdown(report.id)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.id}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyLink = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
      window.prompt("复制这个链接", link);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold">{report.skillName}</h1>
        <p className="mt-2 text-sm text-muted">
          {report.version} · {skillTypeLabel(report.skillType)} · {formatTime(report.evaluatedAt)}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {report.baselineRefs.map((ref) => (
            <li key={ref}>{ref}</li>
          ))}
        </ul>
      </div>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {METRIC_KEYS.map((key) => (
          <MetricCard key={key} metricKey={key} {...report.metrics[key]} />
        ))}
      </section>
      <CaseTable
        rows={rows}
        onOpen={(caseId) => {
          setOpenId(caseId);
          window.setTimeout(() => {
            document.getElementById(`failed-${caseId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 0);
        }}
      />
      <CaseInspect row={rows.find((item) => item.caseId === openId)} />
      <FailedCaseList rows={rows} openId={openId} onOpen={setOpenId} />
      <section className="rounded-lg border border-line bg-white p-4 shadow-card">
        <h2 className="text-base font-semibold">发布建议</h2>
        <p className="mt-3 text-sm">{advice}</p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={download} className="rounded-[6px] bg-primary px-4 py-2 text-sm text-white">
            下载报告
          </button>
          <button type="button" onClick={copyLink} className="rounded-[6px] border border-line px-4 py-2 text-sm">
            {copied ? "已复制" : "复制链接"}
          </button>
          <Link to="/eval/reports" className="px-2 py-2 text-sm text-primary">
            返回列表
          </Link>
        </div>
      </section>
    </div>
  );
}
