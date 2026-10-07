import type { FailureType } from "../types/eval";
import { FAILURE_LABELS } from "../types/eval";

const tone: Record<FailureType, string> = {
  decision: "bg-[#FFF2F0] text-danger",
  narration: "bg-[#FFF7E6] text-[#D48806]",
  fact: "bg-[#E6F4FF] text-primary",
  degradation: "bg-[#F9F0FF] text-[#722ED1]",
};

export function FailureTag({ type }: { type: FailureType }) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs ${tone[type]}`}>
      {FAILURE_LABELS[type]}
    </span>
  );
}
