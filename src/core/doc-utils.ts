import { readdir } from "fs/promises";
import { join, relative, extname, sep } from "path";

const EXCLUDED_FOLDERS = [
  "_assets",
  "_css",
  "_images",
  "_static",
  "_landing",
  "_navbar",
  "_footer",
  "public",
  "node_modules",
];

const EXCLUDED_FILES = [
  "docs-config.json",
  "vercel.json",
  "netlify.toml",
  "README.md",
];

export interface DocFile {
  absolutePath: string;
  relativePath: string;
}

/**
 * Recursively collect all .md and .mdx files under docsPath,
 * excluding asset/config directories and files.
 */
export async function collectMarkdownFiles(
  docsPath: string
): Promise<DocFile[]> {
  const results: DocFile[] = [];

  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const rel = relative(docsPath, fullPath);
      const topSegment = rel.split(sep)[0];

      if (entry.isDirectory()) {
        if (
          EXCLUDED_FOLDERS.includes(topSegment) ||
          EXCLUDED_FOLDERS.includes(entry.name)
        ) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        if (EXCLUDED_FILES.includes(entry.name)) continue;
        const ext = extname(entry.name).toLowerCase();
        if (ext === ".md" || ext === ".mdx") {
          results.push({ absolutePath: fullPath, relativePath: rel });
        }
      }
    }
  }

  await walk(docsPath);
  return results;
}

/**
 * Convert a relative file path to a URL slug.
 *
 * "getting-started/installation.md" → "/getting-started/installation"
 * "introduction/index.mdx"          → "/introduction"
 * "index.md"                        → "/"
 */
export function deriveSlug(relativePath: string): string {
  let slug = relativePath
    .replace(/\.(md|mdx)$/, "")
    .split(sep)
    .join("/");

  if (slug.endsWith("/index")) {
    slug = slug.slice(0, -6);
  }
  if (slug === "index") {
    slug = "";
  }

  return "/" + slug;
}
