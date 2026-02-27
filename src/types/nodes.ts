export interface BaseNode {
  id: string;
  type: "doc" | "concept" | "api" | "workflow" | "step";
  title: string;
  summary: string;
  source_path: string;
  slug: string;
  url?: string;
  anchors: string[];
  version?: string;
  locale?: string;
  tags: string[];
}

export interface DocNode extends BaseNode {
  type: "doc";
  section?: string;
}

export interface ConceptNode extends BaseNode {
  type: "concept";
  entity_type: string;
  canonical_name: string;
  aliases: string[];
  related_entities: string[];
}

export interface ApiNode extends BaseNode {
  type: "api";
  api_type: string;
  operation_id: string;
  method?: string;
  path?: string;
  resource?: string;
  capabilities: string[];
  side_effects: string[];
  preconditions: string[];
  permissions: string[];
  rate_limit?: string;
}

export interface WorkflowNode extends BaseNode {
  type: "workflow";
  workflow_id: string;
  goal: string;
  primary_entity?: string;
  risk_level?: string;
  requires_human_approval: boolean;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  step_number: number;
  action: string;
  uses_api?: string;
}

export interface StepNode extends BaseNode {
  type: "step";
  step_number: number;
  action: string;
  uses_api?: string;
  workflow_id: string;
}

export type GraphNode = DocNode | ConceptNode | ApiNode | WorkflowNode | StepNode;
