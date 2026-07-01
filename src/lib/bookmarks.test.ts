import { describe, it, expect } from "vitest";
import { parseBookmarks } from "./bookmarks";

const SAMPLE = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><A HREF="https://grafana.example.com" ADD_DATE="1">Grafana</A>
  <DT><A HREF="https://ci.example.com/pipelines">CI</A>
  <DT><A HREF="javascript:void(0)">bad</A>
  <DT><A HREF="place:type=6">browser internal</A>
</DL><p>`;

describe("parseBookmarks", () => {
  it("extracts http(s) links with titles", () => {
    const result = parseBookmarks(SAMPLE);
    expect(result).toEqual([
      { title: "Grafana", url: "https://grafana.example.com" },
      { title: "CI", url: "https://ci.example.com/pipelines" },
    ]);
  });

  it("falls back to the URL when there is no title", () => {
    const r = parseBookmarks(`<A HREF="https://x.io"></A>`);
    expect(r[0]).toEqual({ title: "https://x.io", url: "https://x.io" });
  });

  it("returns nothing for empty input", () => {
    expect(parseBookmarks("")).toEqual([]);
  });
});
