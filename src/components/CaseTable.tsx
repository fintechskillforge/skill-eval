import { useMemo, useState } from "react";
import type { CaseRow, FailureType } from "../types/eval";
import { casePassed } from "../mock/cases";
import { CaseStatusTag } from "./CaseStatusTag";

const failureOptions: Array<{ id: "all" | FailureType; label: string }> = [
  { id: "all", label: "全部失败类型" },
  { id: "decision", label: "决定错误" },
  { id: "narration", label: "讲解违规" },
  { id: "fact", label: "事实不一致" },
  { id: "degradation", label: "降级未拦截" },
];

function matchesFailure(row: CaseRow, failure: "all" | FailureType) {
  if (failure === "all") return true;
  if (failure === "decision") return !row.decisionOk;
  if (failure === "narration") return !row.narrationOk;
  if (failure === "fact") return !row.factOk;
  return row.degradationOk === false;
}

export function CaseTable({
  rows,
  onOpen,
}: {
  rows: CaseRow[];
  onOpen: (caseId: string) => void;
}) {
  const [status, setStatus] = useState<"all" | "passed" | "failed">("all");
  const [failure, setFailure] = useState<"all" | FailureType>("all");
  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const passed = casePassed(row);
        if (status === "passed" && !passed) return false;
        if (status === "failed" && passed) return false;
        return matchesFailure(row, failure);
      }),
    [rows, status, failure],
  );

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">用例执行明细</h2>
        <div className="flex flex-wrap gap-2">
          {(["all", "passed", "failed"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-[6px] border px-3 py-1 text-xs ${
                status === item ? "border-primary bg-[#E6F4FF] text-primary" : "border-line"
              }`}
            >
              {item === "all" ? "全部" : item === "passed" ? "通过" : "失败"}
            </button>
          ))}
          <select
            aria-label="按失败类型筛选"
            value={failure}
            onChange={(event) => setFailure(event.target.value as "all" | FailureType)}
            className="rounded-[6px] border border-line bg-white px-2 py-1 text-xs"
          >
            {failureOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              {["用例 ID", "标题", "预期", "实际", "决定", "讲解", "事实", "综合", "操作"].map((head) => (
                <th key={head} className="px-2 py-2 font-normal">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.caseId} className="border-b border-[#F0F0F0]">
                <td className="px-2 py-3 font-mono text-xs">{row.caseId}</td>
                <td className="px-2 py-3">{row.title}</td>
                <td className="px-2 py-3">{row.expected}</td>
                <td className="px-2 py-3">{row.actual}</td>
                <td className="px-2 py-3">{row.decisionOk ? "通过" : "错误"}</td>
                <td className="px-2 py-3">{row.narrationOk ? "通过" : "违规"}</td>
                <td className="px-2 py-3">{row.factOk ? "一致" : "不一致"}</td>
                <td className="px-2 py-3">
                  <CaseStatusTag status={casePassed(row) ? "passed" : "failed"} />
                </td>
                <td className="px-2 py-3">
                  <button type="button" className="text-primary" onClick={() => onOpen(row.caseId)}>
                    展开详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="py-6 text-center text-sm text-muted">没有符合筛选的用例。</p>}
      </div>
    </section>
  );
}
