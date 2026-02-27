export interface Heading {
  depth: number;
  text: string;
  anchor: string;
  children: Heading[];
}

/**
 * Slugify a heading text into an anchor ID.
 * "Getting Started" → "getting-started"
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extract headings from markdown body using regex.
 * Returns a nested tree and a flat list of anchor IDs.
 */
export function extractHeadings(body: string): {
  tree: Heading[];
  anchors: string[];
} {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const flatHeadings: Heading[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(body)) !== null) {
    flatHeadings.push({
      depth: match[1].length,
      text: match[2].trim(),
      anchor: slugify(match[2].trim()),
      children: [],
    });
  }

  const anchors = flatHeadings.map((h) => h.anchor);

  // Build nested tree
  const tree: Heading[] = [];
  const stack: Heading[] = [];

  for (const heading of flatHeadings) {
    const node: Heading = { ...heading, children: [] };

    // Pop stack until we find a parent with lower depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return { tree, anchors };
}
