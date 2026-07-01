import { describe, it, expect } from "vitest";
import {
  buildPath,
  depthFromPath,
  ancestorIds,
  isAncestorPath,
  buildTree,
} from "./tree";

describe("materialized path helpers", () => {
  it("builds root and child paths", () => {
    expect(buildPath(null, "a")).toBe("/a/");
    expect(buildPath("/a/", "b")).toBe("/a/b/");
    expect(buildPath("/a/b/", "c")).toBe("/a/b/c/");
  });

  it("computes depth from path", () => {
    expect(depthFromPath("/a/")).toBe(0);
    expect(depthFromPath("/a/b/")).toBe(1);
    expect(depthFromPath("/a/b/c/")).toBe(2);
  });

  it("lists ancestors excluding self", () => {
    expect(ancestorIds("/a/b/c/")).toEqual(["a", "b"]);
  });

  it("detects ancestry by prefix", () => {
    expect(isAncestorPath("/a/", "/a/b/c/")).toBe(true);
    expect(isAncestorPath("/a/b/", "/a/")).toBe(false);
  });
});

describe("buildTree", () => {
  it("nests rows and sorts by sortOrder", () => {
    const rows = [
      { id: "root", parentId: null, sortOrder: 0 },
      { id: "b", parentId: "root", sortOrder: 1 },
      { id: "a", parentId: "root", sortOrder: 0 },
      { id: "a1", parentId: "a", sortOrder: 0 },
    ];
    const tree = buildTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("root");
    expect(tree[0].children.map((c) => c.id)).toEqual(["a", "b"]);
    expect(tree[0].children[0].children[0].id).toBe("a1");
  });

  it("treats rows with missing parents as roots", () => {
    const tree = buildTree([{ id: "x", parentId: "ghost", sortOrder: 0 }]);
    expect(tree.map((n) => n.id)).toEqual(["x"]);
  });
});
