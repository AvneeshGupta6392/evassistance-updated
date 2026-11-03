// Tiny, dependency-free markdown renderer (bold, italic, inline code, lists, headings).
// Builds React elements only (no dangerouslySetInnerHTML) so it is XSS-safe.
const inline = (text, keyPrefix) => {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyPrefix}-${i++}`;
    if (tok.startsWith("**")) parts.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else parts.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

export const renderMarkdown = (src) => {
  const lines = src.split("\n");
  const out = [];
  let list = null; // { type: 'ul' | 'ol', items: [] }

  const flush = () => {
    if (!list) return;
    const Tag = list.type;
    out.push(
      <Tag key={`l-${out.length}`}>
        {list.items.map((it, i) => (
          <li key={i}>{inline(it, `li-${out.length}-${i}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*•]\s+(.*)/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    const h = line.match(/^#{1,6}\s+(.*)/);

    if (ul || ol) {
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) {
        flush();
        list = { type, items: [] };
      }
      list.items.push((ul || ol)[1]);
      return;
    }
    flush();
    if (!line.trim()) return;
    if (h) {
      out.push(
        <p key={`h-${idx}`} className="md-heading">
          {inline(h[1], `h-${idx}`)}
        </p>
      );
    } else {
      out.push(<p key={`p-${idx}`}>{inline(line, `p-${idx}`)}</p>);
    }
  });
  flush();
  return out;
};
