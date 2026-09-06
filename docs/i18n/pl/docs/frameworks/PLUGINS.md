---
title: "System wtyczek CLI FlawraRoute"
version: 3.8.40
lastUpdated: 2026-06-28
---

# System wtyczek CLI FlawraRoute

Rozszerzaj CLI `flawraroute` bez modyfikowania jego rdzenia. Wtyczki stosują konwencję nazewnictwa `flawraroute-cmd-*`, podobnie jak `gh extension` lub `kubectl plugin`.

## Szybki start

```bash
# Install a plugin from npm
flawraroute plugin install stripe

# Install a local plugin in development
flawraroute plugin install ./my-plugin

# List installed plugins
flawraroute plugin list

# Scaffold a new plugin
flawraroute plugin scaffold myplugin
cd flawraroute-cmd-myplugin
flawraroute plugin install .
```

## Anatomia wtyczki

Wtyczka to pakiet npm o nazwie `flawraroute-cmd-<name>` (lub `@scope/flawraroute-cmd-<name>`).

```
flawraroute-cmd-myplugin/
├── package.json     # must have "type": "module" and "main": "index.mjs"
├── index.mjs        # exports register(program, ctx) + optional meta
└── README.md
```

### `package.json`

```json
{
  "name": "flawraroute-cmd-myplugin",
  "version": "0.1.0",
  "type": "module",
  "main": "index.mjs",
  "engines": { "flawraroute": ">=4.0.0" },
  "keywords": ["flawraroute-plugin", "flawraroute-cmd"]
}
```

### `index.mjs`

```js
export const meta = {
  name: "myplugin",
  version: "0.1.0",
  description: "My plugin for FlawraRoute",
  flawrarouteApi: ">=4.0.0",
};

export function register(program, ctx) {
  program
    .command("myplugin")
    .description(meta.description)
    .option("-n, --name <name>")
    .action(async (opts, cmd) => {
      const gOpts = cmd.optsWithGlobals();
      const res = await ctx.apiFetch("/api/combos", {
        baseUrl: gOpts.baseUrl,
        apiKey: gOpts.apiKey,
      });
      const data = await res.json();
      ctx.emit(data, gOpts);
    });
}
```

## API kontekstu wtyczki

Obiekt `ctx` przekazywany do `register(program, ctx)`:

| Property                     | Type             | Description                                                 |
| ---------------------------- | ---------------- | ----------------------------------------------------------- |
| `ctx.apiFetch(path, opts)`   | `async function` | Uwierzytelniony fetch do serwera FlawraRoute                  |
| `ctx.emit(data, opts)`       | `function`       | Wyjście w formacie table/json/jsonl/csv wg flagi `--output` |
| `ctx.t(key)`                 | `async function` | Wyszukiwanie tłumaczenia i18n                               |
| `ctx.withSpinner(label, fn)` | `async function` | Opakowuje async fn w spinner ora                            |
| `ctx.baseUrl`                | `string`         | Rozwiązany base URL                                         |
| `ctx.apiKey`                 | `string \| null` | Klucz API, jeśli podany                                     |

## Odkrywanie

Wtyczki są wykrywane z:

1. `~/.flawraroute/plugins/<name>/` — instalacje lokalne użytkownika
2. `FLAWRAROUTE_PLUGIN_PATH` env var — niestandardowy katalog

Błędy ładowania są przechwytywane i wypisywane jako ostrzeżenia — uszkodzona wtyczka nigdy nie zawiesza CLI.

## Bezpieczeństwo

Wtyczki działają z tymi samymi uprawnieniami procesu Node.js co `flawraroute`. Instaluj wtyczki wyłącznie ze źródeł, którym ufasz. `flawraroute plugin install` wyświetla wyraźne ostrzeżenie i wymaga `--yes` albo interaktywnego potwierdzenia.

## Publikowanie

1. Upewnij się, że `package.json` ma `"keywords": ["flawraroute-plugin"]`
2. `npm publish` jak zwykle
3. Użytkownicy odkrywają wtyczki przez `flawraroute plugin search <query>` (przeszukuje rejestr npm)

## Przykładowa wtyczka

Zobacz [`examples/flawraroute-cmd-hello/`](../../examples/flawraroute-cmd-hello/index.mjs) — minimalny działający przykład z `meta` + `register()`.
