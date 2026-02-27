// Structural edges
export type StructuralEdgeType = "PARENT_OF" | "CHILD_OF" | "NEXT_SECTION";

// Semantic edges
export type SemanticEdgeType = "RELATED_TO" | "DEPENDS_ON" | "CONTAINS" | "DEPRECATED_BY";

// Capability edges
export type CapabilityEdgeType = "ACTS_ON" | "REQUIRES" | "EMITS" | "USES_API";

// Procedural edges
export type ProceduralEdgeType = "NEXT_STEP_OF" | "ON_FAILURE_TRIGGER" | "ESCALATES_TO";

export type EdgeType =
  | StructuralEdgeType
  | SemanticEdgeType
  | CapabilityEdgeType
  | ProceduralEdgeType;

export interface Edge {
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
}
