import type { GraphNode, ConceptNode, ApiNode, WorkflowNode, StepNode } from "../types/nodes.js";
import type { Edge } from "../types/edges.js";
import { dirname } from "path";

export interface EdgeResolution {
  edges: Edge[];
  warnings: string[];
}

/**
 * Resolve all cross-references between nodes into typed edges.
 */
export function resolveEdges(nodes: GraphNode[]): EdgeResolution {
  const edges: Edge[] = [];
  const warnings: string[] = [];

  // Build lookup maps
  const byCanonicalName = new Map<string, string>(); // canonical_name → id
  const byOperationId = new Map<string, string>(); // operation_id → id
  const byWorkflowId = new Map<string, string>(); // workflow_id → id
  const bySlug = new Map<string, string>(); // slug → id
  const bySourceDir = new Map<string, string[]>(); // directory → node ids

  for (const node of nodes) {
    bySlug.set(node.slug, node.id);

    // Group nodes by parent directory for structural edges
    const dir = dirname(node.source_path);
    if (!bySourceDir.has(dir)) bySourceDir.set(dir, []);
    bySourceDir.get(dir)!.push(node.id);

    if (node.type === "concept") {
      byCanonicalName.set(node.canonical_name.toLowerCase(), node.id);
      for (const alias of node.aliases) {
        byCanonicalName.set(alias.toLowerCase(), node.id);
      }
    }
    if (node.type === "api") {
      byOperationId.set(node.operation_id.toLowerCase(), node.id);
    }
    if (node.type === "workflow") {
      byWorkflowId.set(node.workflow_id.toLowerCase(), node.id);
    }
  }

  function resolveRef(name: string): string | null {
    const lower = name.toLowerCase();
    return (
      byCanonicalName.get(lower) ??
      byOperationId.get(lower) ??
      byWorkflowId.get(lower) ??
      null
    );
  }

  for (const node of nodes) {
    // ConceptNode.related_entities → RELATED_TO edges
    if (node.type === "concept") {
      for (const entity of node.related_entities) {
        const targetId = resolveRef(entity);
        if (targetId) {
          edges.push({ source: node.id, target: targetId, type: "RELATED_TO", label: entity });
        } else {
          edges.push({ source: node.id, target: `unresolved:${entity}`, type: "RELATED_TO", label: entity });
          warnings.push(`Unresolved related_entity "${entity}" in ${node.source_path}`);
        }
      }
    }

    // ApiNode.resource → ACTS_ON edge to matching ConceptNode
    if (node.type === "api" && node.resource) {
      const targetId = byCanonicalName.get(node.resource.toLowerCase());
      if (targetId) {
        edges.push({ source: node.id, target: targetId, type: "ACTS_ON", label: node.resource });
      } else {
        edges.push({ source: node.id, target: `unresolved:${node.resource}`, type: "ACTS_ON", label: node.resource });
        warnings.push(`Unresolved resource "${node.resource}" in ${node.source_path}`);
      }
    }

    // WorkflowNode → primary_entity ACTS_ON + step chains
    if (node.type === "workflow") {
      // primary_entity → ACTS_ON
      if (node.primary_entity) {
        const targetId = byCanonicalName.get(node.primary_entity.toLowerCase());
        if (targetId) {
          edges.push({ source: node.id, target: targetId, type: "ACTS_ON", label: node.primary_entity });
        } else {
          edges.push({ source: node.id, target: `unresolved:${node.primary_entity}`, type: "ACTS_ON", label: node.primary_entity });
          warnings.push(`Unresolved primary_entity "${node.primary_entity}" in ${node.source_path}`);
        }
      }
    }

    // StepNode → NEXT_STEP_OF chain + USES_API edges
    if (node.type === "step") {
      // USES_API edge
      if (node.uses_api) {
        const apiId = byOperationId.get(node.uses_api.toLowerCase());
        if (apiId) {
          edges.push({ source: node.id, target: apiId, type: "USES_API", label: node.uses_api });
        } else {
          edges.push({ source: node.id, target: `unresolved:${node.uses_api}`, type: "USES_API", label: node.uses_api });
          warnings.push(`Unresolved API reference "${node.uses_api}" in step ${node.step_number} of ${node.source_path}`);
        }
      }

      // CONTAINS edge from workflow to step
      const workflowId = byWorkflowId.get(node.workflow_id.toLowerCase());
      if (workflowId) {
        edges.push({ source: workflowId, target: node.id, type: "CONTAINS" });
      }
    }
  }

  // NEXT_STEP_OF chain: link consecutive steps in each workflow
  const stepsByWorkflow = new Map<string, StepNode[]>();
  for (const node of nodes) {
    if (node.type === "step") {
      if (!stepsByWorkflow.has(node.workflow_id)) stepsByWorkflow.set(node.workflow_id, []);
      stepsByWorkflow.get(node.workflow_id)!.push(node);
    }
  }
  for (const [, steps] of stepsByWorkflow) {
    steps.sort((a, b) => a.step_number - b.step_number);
    for (let i = 0; i < steps.length - 1; i++) {
      edges.push({
        source: steps[i].id,
        target: steps[i + 1].id,
        type: "NEXT_STEP_OF",
      });
    }
  }

  // Structural: PARENT_OF / CHILD_OF based on folder hierarchy
  // For nodes in subdirectories, find their parent directory's index node
  const indexNodes = new Map<string, string>(); // dir → index node id
  for (const node of nodes) {
    if (node.source_path.endsWith("index.md") || node.source_path.endsWith("index.mdx")) {
      indexNodes.set(dirname(node.source_path), node.id);
    }
  }

  for (const node of nodes) {
    const nodeDir = dirname(node.source_path);
    // Skip index files pointing to themselves
    if (node.source_path.endsWith("index.md") || node.source_path.endsWith("index.mdx")) {
      // Look for parent directory's index
      const parentDir = dirname(nodeDir);
      const parentId = indexNodes.get(parentDir);
      if (parentId && parentId !== node.id) {
        edges.push({ source: parentId, target: node.id, type: "PARENT_OF" });
        edges.push({ source: node.id, target: parentId, type: "CHILD_OF" });
      }
    } else {
      // Regular file → find index in same directory
      const parentId = indexNodes.get(nodeDir);
      if (parentId) {
        edges.push({ source: parentId, target: node.id, type: "PARENT_OF" });
        edges.push({ source: node.id, target: parentId, type: "CHILD_OF" });
      }
    }
  }

  return { edges, warnings };
}
