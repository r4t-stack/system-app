// Parse a Netscape bookmarks export (what browsers produce) into flat links.
// We intentionally keep this dependency-free and forgiving.

export type ParsedBookmark = { title: string; url: string };

const ANCHOR_RE = /<a\s+[^>]*href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

export function parseBookmarks(html: string): ParsedBookmark[] {
  const out: ParsedBookmark[] = [];
  let m: RegExpExecArray | null;
  while ((m = ANCHOR_RE.exec(html)) !== null) {
    const url = m[1].trim();
    // Skip javascript: and place: (browser internal) links.
    if (!/^https?:\/\//i.test(url)) continue;
    const title = m[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    out.push({ title: title || url, url });
  }
  return out;
}
