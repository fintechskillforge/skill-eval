import type { CaseRow } from "../types/eval";
import { mustNotWords, casePassed } from "../mock/cases";
import { FailureTag } from "./FailureTag";
import { HighlightedText } from "./HighlightedText";
import type { FailureType } from "../types/eval";

function typesOf(row: CaseRow): FailureType[] {
  const types: FailureType[] = [];
  if (!row.decisionOk) types.push("decision");
  if (!row.narrationOk) types.push("narration");
  if (!row.factOk) types.push("fact");
  if (row.degradationOk === false) types.push("degradation");
  return types;
}

export function FailedCaseList({
  rows,
  openId,
  onOpen,
}: {
  rows: CaseRow[];
  openId: string;
  onOpen: (caseId: string) => void;
}) {
  const failed = rows.filter((row) => !casePassed(row));
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-card">
      <h2 className="text-base font-semibold">失败用例详情</h2>
      {!failed.length && <p className="mt-3 text-sm text-muted">无。</p>}
      <div className="mt-3 space-y-2">
        {failed.map((row) => {
          const open = openId === row.caseId;
          return (
            <article key={row.caseId} id={`failed-${row.caseId}`} className="rounded-[6px] border border-line">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                aria-expanded={open}
                onClick={() => onOpen(open ? "" : row.caseId)}
              >
                <span className="text-sm">
                  <span className="font-mono text-xs text-muted">{row.caseId}</span>
                  <span className="mx-2">{row.title}</span>
                </span>
                <span className="flex items-center gap-2">
                  {typesOf(row).map((type) => (
                    <FailureTag key={type} type={type} />
                  ))}
                  <span className="text-xs text-muted">{open ? "收起" : "展开"}</span>
                </span>
              </button>
              {open && (
                <div className="space-y-3 border-t border-line px-3 py-3 text-sm">
                  <p>
                    <span className="text-muted">失败原因：</span>
                    {row.reasons.join("；") || "未标注"}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <pre className="overflow-auto rounded bg-canvas p-3 text-xs">{JSON.stringify(row.facts, null, 2)}</pre>
                    <div className="space-y-2">
                      <p>预期：{row.expectedOutput}</p>
                      <p>实际：{row.actualOutput}</p>
                    </div>
                  </div>
                  <p className="leading-6">
                    <span className="text-muted">讲解：</span>
                    <HighlightedText text={row.narration} words={mustNotWords} />
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
