function escapeReg(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({ text, words }: { text: string; words: string[] }) {
  const sorted = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!sorted.length || !text) return <span>{text}</span>;
  const pattern = new RegExp(sorted.map(escapeReg).join("|"), "g");
  const nodes: Array<string | { word: string; at: number }> = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > cursor) nodes.push(text.slice(cursor, at));
    nodes.push({ word: match[0], at });
    cursor = at + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return (
    <span>
      {nodes.map((node, index) =>
        typeof node === "string" ? (
          <span key={index}>{node}</span>
        ) : (
          <mark key={index} className="rounded-sm bg-[#FFCCC7] px-0.5 text-ink">
            {node.word}
          </mark>
        ),
      )}
    </span>
  );
}
