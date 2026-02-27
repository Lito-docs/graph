# Lito Graph

Compile Markdown docs into a knowledge & workflow graph for AI agents. Expose it via MCP so IDEs and assistants can reason, plan, and act over your documentation — not just search it.

Part of the [Lito](https://github.com/Lito-docs/cli) documentation ecosystem.

## Why

Traditional docs are flat text optimized for human reading. AI agents need **structured, traversable knowledge** to:

- **Discover** capabilities — "What APIs act on the Workspace entity?"
- **Plan** multi-step tasks — "Walk me through the onboarding workflow, step by step"
- **Stay safe** — "Does this workflow require human approval? What are the guardrails?"

Lito Graph compiles your Markdown into a typed knowledge graph with nodes (concepts, APIs, workflows, steps) and edges (ACTS_ON, USES_API, NEXT_STEP_OF, etc.), then serves it over MCP.

## Quick Start

```bash
# Install
cd lito-graph
bun install

# Build a graph from your docs
bun run bin/cli.ts build -i ../docs -o ./graph.json

# Inspect it
bun run bin/cli.ts inspect -g ./graph.json --stats

# Start MCP server
bun run bin/cli.ts serve -g ./graph.json
```

## Document Types

Add `type` to your Markdown frontmatter to create rich graph nodes:

### Concept Docs

```yaml
---
type: concept
canonical_name: "Workspace"
entity_type: "resource"
aliases: ["Org Workspace"]
related_entities: ["User", "Project"]
---
```

### API Docs

```yaml
---
type: api
operation_id: "create_workspace"
method: "POST"
path: "/v1/workspaces"
resource: "Workspace"
capabilities: ["create"]
preconditions: ["user_authenticated"]
permissions: ["workspace:write"]
---
```

### Workflow Docs

```yaml
---
type: workflow
workflow_id: "onboard_new_workspace"
goal: "Onboard a new customer workspace."
risk_level: "medium"
requires_human_approval: true
---
```

Existing Lito API docs (`api: "GET /users"`) are auto-converted — no migration needed.

## CLI Commands

| Command | Description |
|---------|-------------|
| `lito-graph build -i ./docs -o ./graph.json` | Compile docs into graph |
| `lito-graph serve -g ./graph.json` | Start MCP server on stdio |
| `lito-graph serve -i ./docs` | Build + serve in one step |
| `lito-graph inspect -g ./graph.json --stats` | Graph overview |
| `lito-graph inspect -g ./graph.json --nodes` | List all nodes |
| `lito-graph inspect -g ./graph.json --orphans` | Find disconnected nodes |
| `lito-graph inspect -g ./graph.json --unresolved` | Show broken references |

## MCP Tools

The server exposes 7 tools for agents:

| Tool | Description |
|------|-------------|
| `list_nodes` | Filter nodes by type or tag |
| `get_node` | Full details by ID or slug |
| `traverse` | Walk edges from a node |
| `search` | Keyword search across the graph |
| `get_workflow` | Complete workflow with steps + linked APIs |
| `find_apis_for_entity` | All APIs acting on an entity |
| `get_graph_stats` | Overview statistics |

## IDE Setup

### Claude Code

Add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "lito-graph": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "path/to/lito-graph/bin/cli.ts", "serve", "-g", "./graph.json"]
    }
  }
}
```

### Claude Desktop / Cursor

Add to your MCP settings:

```json
{
  "mcpServers": {
    "lito-graph": {
      "command": "bun",
      "args": ["run", "path/to/lito-graph/bin/cli.ts", "serve", "-g", "./graph.json"]
    }
  }
}
```

## Public Graph Hosting

Build with `--base-url` so every node gets a full public URL:

```bash
lito-graph build -i ./docs -o ./graph.json --base-url https://docs.example.com
```

Each node gets a `url` field agents can navigate to:

```json
{
  "title": "Create Workspace",
  "slug": "/api/create-workspace",
  "url": "https://docs.example.com/api/create-workspace"
}
```

Host `graph.json` alongside your docs (e.g., in `public/`), then any agent can connect remotely:

```bash
lito-graph serve --url https://docs.example.com/graph.json
```

Works with **any** docs framework — Lito, Mintlify, Docusaurus, Fern, VitePress, GitBook. If it has Markdown files, Lito Graph can compile them.

## Lito Graph vs Context7 MCP

Lito Graph and [Context7](https://context7.com) solve **different problems**. Use both.

|  | Context7 | Lito Graph |
|---|---|---|
| **Purpose** | Look up third-party library docs | Operate on your own product/domain |
| **Data** | Flat text chunks (RAG) | Typed nodes + 14 edge types (graph) |
| **Relationships** | None — isolated text | `ACTS_ON`, `USES_API`, `RELATED_TO`, etc. |
| **Planning** | Single page at a time | Full workflows with ordered steps + linked APIs |
| **Safety** | Hope the agent reads the warning | `requires_human_approval`, `risk_level`, `guardrails` as machine-readable fields |
| **Completeness** | Top-k search (might miss things) | Graph traversal (guaranteed exhaustive) |
| **Setup** | Zero — works instantly | Requires build step + optional frontmatter |
| **Privacy** | Cloud service | Fully local, self-hosted |

### When to use what

| Scenario | Best tool |
|----------|-----------|
| "How do I use Express middleware?" | Context7 |
| "What's the full onboarding flow for our platform?" | **Lito Graph** |
| "What's the React useState API?" | Context7 |
| "Which of our APIs require admin permissions?" | **Lito Graph** |
| "How do I configure Tailwind?" | Context7 |
| "What happens if workspace creation fails?" | **Lito Graph** |

**Context7** prevents hallucinating API signatures (external knowledge).
**Lito Graph** prevents unsafe actions on your own systems (internal knowledge).

## Graph Data Model

### Node Types

- **DocNode** — standard documentation pages
- **ConceptNode** — domain entities (Workspace, User, Project)
- **ApiNode** — callable capabilities (HTTP endpoints, functions)
- **WorkflowNode** — multi-step procedures with guardrails
- **StepNode** — individual actions within workflows

### Edge Types

- **Structural:** PARENT_OF, CHILD_OF, NEXT_SECTION
- **Semantic:** RELATED_TO, DEPENDS_ON, CONTAINS, DEPRECATED_BY
- **Capability:** ACTS_ON, REQUIRES, EMITS, USES_API
- **Procedural:** NEXT_STEP_OF, ON_FAILURE_TRIGGER, ESCALATES_TO

## License

MIT
