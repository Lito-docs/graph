import type { GraphNode } from "./nodes.js";
import type { Edge } from "./edges.js";

export interface GraphStats {
  total_nodes: number;
  total_edges: number;
  nodes_by_type: Record<string, number>;
  edges_by_type: Record<string, number>;
  unresolved_refs: number;
}

export interface LitoGraph {
  version: string;
  generated_at: string;
  source_dir: string;
  stats: GraphStats;
  nodes: GraphNode[];
  edges: Edge[];
}
