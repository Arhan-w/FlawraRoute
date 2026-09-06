export type ServerLifecyclePhase = "starting" | "ready" | "stopping";

declare global {
  var __flawrarouteServerLifecycle: ServerLifecyclePhase | undefined;
}

export function getServerLifecyclePhase(): ServerLifecyclePhase {
  return globalThis.__flawrarouteServerLifecycle ?? "starting";
}

export function markServerStarting(): void {
  globalThis.__flawrarouteServerLifecycle = "starting";
}

export function markServerReady(): void {
  if (getServerLifecyclePhase() !== "stopping") {
    globalThis.__flawrarouteServerLifecycle = "ready";
  }
}

export function markServerStopping(): void {
  globalThis.__flawrarouteServerLifecycle = "stopping";
}
