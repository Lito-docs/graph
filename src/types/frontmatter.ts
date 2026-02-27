import { z } from "zod";

export const StandardFrontmatterSchema = z.object({
  type: z.literal("doc").optional().default("doc"),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  author: z.string().optional(),
  publishDate: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  section: z.string().optional(),
  version: z.string().optional(),
  locale: z.string().optional(),
});

export const ConceptFrontmatterSchema = z.object({
  type: z.literal("concept"),
  title: z.string().optional(),
  description: z.string().optional(),
  entity_type: z.string().default("resource"),
  canonical_name: z.string(),
  aliases: z.array(z.string()).optional().default([]),
  related_entities: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  version: z.string().optional(),
  locale: z.string().optional(),
});

export const ApiFrontmatterSchema = z.object({
  type: z.literal("api"),
  title: z.string().optional(),
  description: z.string().optional(),
  api_type: z.string().default("http"),
  operation_id: z.string(),
  method: z.string().optional(),
  path: z.string().optional(),
  resource: z.string().optional(),
  capabilities: z.array(z.string()).optional().default([]),
  side_effects: z.array(z.string()).optional().default([]),
  preconditions: z.array(z.string()).optional().default([]),
  permissions: z.array(z.string()).optional().default([]),
  rate_limit: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  version: z.string().optional(),
  locale: z.string().optional(),
});

export const WorkflowFrontmatterSchema = z.object({
  type: z.literal("workflow"),
  title: z.string().optional(),
  description: z.string().optional(),
  workflow_id: z.string(),
  goal: z.string(),
  primary_entity: z.string().optional(),
  risk_level: z.string().optional(),
  requires_human_approval: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  version: z.string().optional(),
  locale: z.string().optional(),
});

/** Discriminated union: detect type from frontmatter `type` field */
export const FrontmatterSchema = z.discriminatedUnion("type", [
  ConceptFrontmatterSchema,
  ApiFrontmatterSchema,
  WorkflowFrontmatterSchema,
  // Standard doc is last — used when type is "doc" or absent
  StandardFrontmatterSchema.extend({ type: z.literal("doc") }),
]);

export type StandardFrontmatter = z.infer<typeof StandardFrontmatterSchema>;
export type ConceptFrontmatter = z.infer<typeof ConceptFrontmatterSchema>;
export type ApiFrontmatter = z.infer<typeof ApiFrontmatterSchema>;
export type WorkflowFrontmatter = z.infer<typeof WorkflowFrontmatterSchema>;
export type Frontmatter = z.infer<typeof FrontmatterSchema>;
