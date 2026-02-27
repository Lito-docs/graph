import { describe, test, expect } from "bun:test";
import { extractHeadings } from "../../src/core/heading-extractor.js";

describe("extractHeadings", () => {
  test("extracts flat headings", () => {
    const body = `# Introduction

Some text.

## Getting Started

More text.

## Advanced Usage

Even more.`;

    const { tree, anchors } = extractHeadings(body);
    expect(anchors).toEqual(["introduction", "getting-started", "advanced-usage"]);
    expect(tree).toHaveLength(1);
    expect(tree[0].text).toBe("Introduction");
    expect(tree[0].children).toHaveLength(2);
  });

  test("builds nested tree", () => {
    const body = `## Overview

### Sub-topic A

### Sub-topic B

## Another Section

### Sub-topic C`;

    const { tree, anchors } = extractHeadings(body);
    expect(anchors).toHaveLength(5);
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[1].children).toHaveLength(1);
  });

  test("handles empty body", () => {
    const { tree, anchors } = extractHeadings("");
    expect(tree).toEqual([]);
    expect(anchors).toEqual([]);
  });

  test("slugifies headings correctly", () => {
    const body = `## Getting Started!
## Hello World (2024)
## Multiple   Spaces`;

    const { anchors } = extractHeadings(body);
    expect(anchors).toEqual(["getting-started", "hello-world-2024", "multiple-spaces"]);
  });
});
