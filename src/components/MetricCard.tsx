import type { MetricKey } from "../types/eval";
import { METRIC_LABELS } from "../types/eval";
import { percent, thresholdText } from "../lib/format";

export function MetricCard({
  metricKey,
  score,
  threshold,
  passed,
  detail,
}: {
  metricKey: MetricKey;
  score: number;
  threshold: number;
  passed: boolean;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{METRIC_LABELS[metricKey]}</h3>
        <span className={passed ? "text-success" : "text-danger"} aria-label={passed ? "通过" : "不通过"}>
          {passed ? "✅" : "❌"}
        </span>
      </div>
      <p className="mt-3 text-[20px] font-semibold leading-none">
        {percent(score)}
        <span className="ml-2 text-xs font-normal text-muted">({detail})</span>
      </p>
      <p className="mt-2 text-xs text-muted">阈值 {thresholdText(metricKey, threshold)}</p>
    </article>
  );
}
