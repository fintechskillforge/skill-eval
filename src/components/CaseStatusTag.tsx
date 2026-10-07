export function CaseStatusTag({ status }: { status: "passed" | "failed" }) {
  const passed = status === "passed";
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
        passed ? "bg-[#F6FFED] text-success" : "bg-[#FFF2F0] text-danger"
      }`}
    >
      {passed ? "✅ 通过" : "❌ 失败"}
    </span>
  );
}
