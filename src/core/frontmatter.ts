import matter from "gray-matter";
import {
  StandardFrontmatterSchema,
  ConceptFrontmatterSchema,
  ApiFrontmatterSchema,
  WorkflowFrontmatterSchema,
} from "../types/frontmatter.js";
import type { Frontmatter } from "../types/frontmatter.js";

export interface ParsedDoc {
  frontmatter: Frontmatter;
  body: string;
  rawData: Record<string, unknown>;
}

/**
 * Parse frontmatter from file content using gray-matter,
 * then validate and classify using Zod schemas.
 *
 * Handles backward compatibility with existing Lito `api: "GET /users"` format.
 */
export function parseAndClassify(content: string): ParsedDoc {
  const { data, content: body } = matter(content);

  // Backward compat: convert `api: "GET /users"` to ApiNode format
  if (!data.type && data.api && typeof data.api === "string") {
    const match = data.api.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(.+)$/i);
    if (match) {
      data.type = "api";
      data.method = match[1].toUpperCase();
      data.path = match[2];
      if (!data.operation_id) {
        // Derive operation_id from method + path: "POST /v1/workspaces" → "post_v1_workspaces"
        data.operation_id = `${match[1].toLowerCase()}_${match[2].replace(/^\//, "").replace(/[\/{}]/g, "_")}`;
      }
      if (!data.api_type) {
        data.api_type = "http";
      }
      delete data.api;
    }
  }

  // Detect type and validate
  const type = data.type || "doc";
  let frontmatter: Frontmatter;

  switch (type) {
    case "concept":
      frontmatter = ConceptFrontmatterSchema.parse(data);
      break;
    case "api":
      frontmatter = ApiFrontmatterSchema.parse(data);
      break;
    case "workflow":
      frontmatter = WorkflowFrontmatterSchema.parse(data);
      break;
    default:
      frontmatter = StandardFrontmatterSchema.parse({ ...data, type: "doc" }) as Frontmatter & { type: "doc" };
      break;
  }

  return { frontmatter, body, rawData: data };
}
