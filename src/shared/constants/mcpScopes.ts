/**
 * MCP Authorization Scopes — Defines permission scopes for each MCP tool.
 *
 * Each tool requires specific scopes to execute. API keys can be configured
 * with a subset of scopes to limit tool access (least-privilege).
 */

// ============ Scope Definitions ============

/** All available MCP scopes */
export const MCP_SCOPE_LIST = [
  "read:health",
  "read:combos",
  "write:combos",
  "read:quota",
  "read:usage",
  "read:models",
  "read:radar",
  "execute:completions",
  "execute:search",
  "write:budget",
  "write:resilience",
  "pricing:write",
  "read:cache",
  "write:cache",
  "read:compression",
  "write:compression",
  "read:proxies",
] as const;

export type McpScope = (typeof MCP_SCOPE_LIST)[number];

// ============ Tool → Scope Mapping ============

/** Maps each MCP tool to its required scopes */
export const MCP_TOOL_SCOPES: Record<string, readonly McpScope[]> = {
  // Phase 1: Essential Tools
  flawraroute_get_health: ["read:health"],
  flawraroute_list_combos: ["read:combos"],
  flawraroute_get_combo_metrics: ["read:combos"],
  flawraroute_switch_combo: ["write:combos"],
  flawraroute_check_quota: ["read:quota"],
  flawraroute_route_request: ["execute:completions"],
  flawraroute_web_search: ["execute:search"],
  flawraroute_x_search: ["execute:search"],
  flawraroute_web_fetch: ["execute:search"],
  flawraroute_cost_report: ["read:usage"],
  flawraroute_list_models_catalog: ["read:models"],
  flawraroute_radar_catalog: ["read:radar"],

  // Phase 2: Advanced Tools
  flawraroute_simulate_route: ["read:health", "read:combos"],
  flawraroute_set_budget_guard: ["write:budget"],
  flawraroute_set_resilience_profile: ["write:resilience"],
  flawraroute_test_combo: ["execute:completions", "read:combos"],
  flawraroute_get_provider_metrics: ["read:health"],
  flawraroute_best_combo_for_task: ["read:combos", "read:health"],
  flawraroute_explain_route: ["read:health", "read:usage"],
  flawraroute_get_session_snapshot: ["read:usage"],
  flawraroute_db_health_check: ["read:health", "write:resilience"],
  flawraroute_sync_pricing: ["pricing:write"],
  flawraroute_cache_stats: ["read:cache"],
  flawraroute_cache_flush: ["write:cache"],
  flawraroute_compression_status: ["read:compression"],
  flawraroute_compression_configure: ["write:compression"],
  flawraroute_set_compression_engine: ["write:compression"],
  flawraroute_list_compression_combos: ["read:compression"],
  flawraroute_compression_combo_stats: ["read:compression"],
  flawraroute_ccr_store: ["write:compression"],
  flawraroute_ccr_retrieve: ["read:compression"],
  flawraroute_ccr_inspect: ["read:compression"],
  flawraroute_ccr_list: ["read:compression"],
  flawraroute_ccr_delete: ["write:compression"],
  flawraroute_ccr_stats: ["read:compression"],
  flawraroute_oneproxy_fetch: ["read:proxies"],
  flawraroute_oneproxy_rotate: ["read:proxies"],
  flawraroute_oneproxy_stats: ["read:proxies"],

  // Web-session pool observability (read) + lifecycle (write)
  flawraroute_pool_status: ["read:health"],
  flawraroute_pool_sessions: ["read:health"],
  flawraroute_pool_health: ["read:health"],
  flawraroute_pool_reset: ["write:resilience"],
  flawraroute_pool_warm: ["write:resilience"],
  // Stealth browser pool observability (#3368 PR7)
  flawraroute_browser_pool_status: ["read:health"],
} as const;
