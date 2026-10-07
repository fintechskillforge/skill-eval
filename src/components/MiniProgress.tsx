export function MiniProgress({ value, threshold }: { value: number; threshold: number }) {
  const passed = value + 1e-9 >= threshold;
  const width = Math.max(0, Math.min(100, value * 100));
  const mark = Math.max(0, Math.min(100, threshold * 100));
  return (
    <div className="relative h-2 w-full rounded-full bg-[#F0F0F0]" title={`得分 ${Math.round(value * 100)}%，阈值 ${Math.round(threshold * 100)}%`}>
      <div
        className="h-2 rounded-full"
        style={{ width: `${width}%`, background: passed ? "#52C41A" : "#FF4D4F" }}
      />
      <div className="absolute -top-0.5 h-3 w-px bg-danger" style={{ left: `${mark}%` }} />
    </div>
  );
}
