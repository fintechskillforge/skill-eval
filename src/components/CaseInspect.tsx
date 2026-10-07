import type { CaseRow } from "../types/eval";
import { mustNotWords } from "../mock/cases";
import { HighlightedText } from "./HighlightedText";

export function CaseInspect({ row }: { row: CaseRow | undefined }) {
  if (!row) return null;
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-card">
      <h2 className="text-base font-semibold">用例 {row.caseId}</h2>
      <p className="mt-1 text-sm text-muted">{row.title}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <pre className="overflow-auto rounded bg-canvas p-3 text-xs">{JSON.stringify(row.facts, null, 2)}</pre>
        <div className="space-y-2 text-sm">
          <p>预期：{row.expectedOutput}</p>
          <p>实际：{row.actualOutput}</p>
          {!!row.reasons.length && <p>原因：{row.reasons.join("；")}</p>}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6">
        <span className="text-muted">讲解：</span>
        <HighlightedText text={row.narration} words={mustNotWords} />
      </p>
    </section>
  );
}
