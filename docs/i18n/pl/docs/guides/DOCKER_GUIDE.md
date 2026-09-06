---
title: "🐳 Przewodnik Docker — FlawraRoute"
version: 3.8.40
lastUpdated: 2026-06-28
---

# 🐳 Przewodnik Docker — FlawraRoute

> Kompletne odniesienie do wdrożenia w Dockerze. Szybki start: [sekcja Docker w README](../README.md#-docker).

## Spis treści

- [Szybkie uruchomienie](#szybkie-uruchomienie)
- [Z plikiem środowiskowym](#z-plikiem-środowiskowym)
- [Docker Compose](#docker-compose)
- [Dostępne profile](#dostępne-profile)
- [Sidecar Redis](#sidecar-redis)
- [Compose produkcyjny](#compose-produkcyjny)
- [Etapy Dockerfile](#etapy-dockerfile)
- [Kluczowe zmienne środowiskowe](#kluczowe-zmienne-środowiskowe)
- [Docker Compose z Caddy (HTTPS)](#docker-compose-z-caddy-https-auto-tls)
- [Cloudflare Quick Tunnel](#cloudflare-quick-tunnel)
- [Tagi obrazów](#tagi-obrazów)
- [Ważne uwagi](#ważne-uwagi)

---

## Szybkie uruchomienie

```bash
docker run -d \
  --name flawraroute \
  --restart unless-stopped \
  --stop-timeout 40 \
  -p 20128:20128 \
  -v flawraroute-data:/app/data \
  diegosouzapw/flawraroute:latest
```

## Z plikiem środowiskowym

```bash
# Copy and edit .env first
cp .env.example .env

docker run -d \
  --name flawraroute \
  --restart unless-stopped \
  --stop-timeout 40 \
  --env-file .env \
  -p 20128:20128 \
  -v flawraroute-data:/app/data \
  diegosouzapw/flawraroute:latest
```

## Docker Compose

```bash
# Base profile (no CLI tools)
docker compose --profile base up -d

# CLI profile (Claude Code, Codex, OpenClaw built-in)
docker compose --profile cli up -d

# Host profile (Linux-first; mounts host CLI binaries read-only)
docker compose --profile host up -d

# Combine CLI + CLIProxyAPI sidecar
docker compose --profile cli --profile cliproxyapi up -d
```

## Dostępne profile

FlawraRoute dostarcza cztery profile Compose. Wybierz ten, który pasuje do Twojego środowiska.

| Profil            | Usługa           | Kiedy używać                                                                                                                              | Polecenie                                    |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `base` (domyślny) | `flawraroute-base` | Serwer headless / minimalne runtime, bez dołączonych CLI providerów                                                                       | `docker compose --profile base up -d`        |
| `cli`             | `flawraroute-cli`  | Przepływy agentowe wywołujące `flawraroute providers/setup/doctor` oraz dołączone CLI (Codex, Claude Code, Droid, OpenClaw)                 | `docker compose --profile cli up -d`         |
| `host`            | `flawraroute-host` | Hosty Linux z dostępem do CLI hosta w stylu `network_mode` przez montowanie `~/.local/bin`, `~/.codex`, `~/.claude` itd. tylko do odczytu | `docker compose --profile host up -d`        |
| `cliproxyapi`     | `cliproxyapi`    | Uruchomienie sidecara [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) na porcie `8317` do proxy CLI upstream                  | `docker compose --profile cliproxyapi up -d` |

> Profile można łączyć: `docker compose --profile cli --profile cliproxyapi up -d`.

## Sidecar Redis

FlawraRoute korzysta z Redis jako zaplecza rozproszonego rate limitera i współdzielonej pamięci podręcznej. Usługa `redis` jest **zawsze zdefiniowana** w `docker-compose.yml` (bez bramki profilu) i startuje razem z każdym innym profilem.

| Szczegół             | Wartość                           |
| -------------------- | --------------------------------- |
| Image                | `redis:7-alpine`                  |
| Container name       | `flawraroute-redis`                 |
| Internal port        | `6379`                            |
| Host port (override) | `REDIS_PORT` (defaults to `6379`) |
| Volume               | `flawraroute-redis-data` → `/data`  |
| Healthcheck          | `redis-cli ping` (10s interval)   |

Powiązane zmienne środowiskowe:

- `REDIS_URL` — connection string wstrzykiwany do aplikacji (domyślnie `redis://redis:6379`).
- `REDIS_PORT` — mapowanie portu po stronie hosta dla kontenera Redis.

**Wyłączanie Redis** nie jest zalecane (rate limiter przejdzie na awaryjny tryb in-memory). Jeśli musisz, usuń/zakomentuj blok usługi `redis:` w `docker-compose.yml` albo przeskaluj do zera:

```bash
docker compose up -d --scale redis=0
```

## Compose produkcyjny

Dla izolowanego snapshota produkcyjnego działającego obok dev użyj `docker-compose.prod.yml`.

| Szczegół               | Wartość                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| File                   | `docker-compose.prod.yml`                                                          |
| Default dashboard port | `PROD_DASHBOARD_PORT=20130` (mapped to internal `${DASHBOARD_PORT:-20128}`)        |
| Default API port       | `PROD_API_PORT=20131`                                                              |
| Image                  | `flawraroute:prod` (built from `runner-cli` target)                                  |
| Redis container        | `flawraroute-redis-prod` (`redis:8.6.2`, dedicated `redis-prod-data` volume)         |
| Data volume            | `flawraroute-prod-data` (named, persisted across rebuilds)                           |
| Healthchecks           | `node healthcheck.mjs` + `redis-cli ping`, with `depends_on` gated on Redis health |

Jak używać:

```bash
# Build & start the production stack
docker compose -f docker-compose.prod.yml up -d --build

# Stream logs
docker compose -f docker-compose.prod.yml logs -f

# Tear down (keep volumes)
docker compose -f docker-compose.prod.yml down
```

Stos produkcyjny działa równolegle z compose dev (inne nazwy kontenerów, porty i wolumeny), więc możesz iterować lokalnie, podczas gdy produkcja pozostaje włączona.

## Etapy Dockerfile

Repozytorium dostarcza wieloetapowy Dockerfile (`Dockerfile`). Udostępnione są trzy etapy; wybierz właściwy `target` do swojego przypadku.

| Etap          | Obraz bazowy               | Przeznaczenie                                                                                                                                                              |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `builder`     | `node:24.15.0-trixie-slim` | Instaluje zależności (`npm ci --legacy-peer-deps`) i uruchamia `npm run build -- --webpack`                                                                                |
| `runner-base` | `node:24.15.0-trixie-slim` | Runtime produkcyjny z wyjściem standalone Next.js. **Bez dołączonych CLI providerów.**                                                                                     |
| `runner-cli`  | `runner-base`              | Dodaje `git`, `docker.io`, `docker-compose` oraz globalne CLI: `@openai/codex`, `@anthropic-ai/claude-code`, `droid`, `openclaw`. **Wybierz to do przepływów agentowych.** |

Ręczne zbudowanie wybranego targetu:

```bash
docker build --target runner-base -t flawraroute:base .
docker build --target runner-cli  -t flawraroute:cli  .
```

Domyślne wartości eksportowane przez `runner-base`: `PORT=20128`, `HOSTNAME=0.0.0.0`, `NODE_OPTIONS=--max-old-space-size=512`, `DATA_DIR=/app/data`, `FLAWRAROUTE_MIGRATIONS_DIR=/app/migrations`.

Zachowanie pamięci w Dockerze:

- `NODE_OPTIONS=--max-old-space-size=512` jest wbudowane w obraz jako fallback.
- Właściwy proces serwera uruchamia launcher standalone, który czyta `FLAWRAROUTE_MEMORY_MB` i dopisuje `--max-old-space-size=<FLAWRAROUTE_MEMORY_MB>`.
- Node używa ostatniej powtórzonej wartości `--max-old-space-size`, więc ustawienie `FLAWRAROUTE_MEMORY_MB` kontroluje efektywny limit heapa w Dockerze.
- Gdy `FLAWRAROUTE_MEMORY_MB` nie jest ustawione, launcher używa `512`.

## Kluczowe zmienne środowiskowe

Poza domyślnymi wartościami opisanymi w [ENVIRONMENT.md](../reference/ENVIRONMENT.md), poniższe zmienne mają największe znaczenie przy uruchamianiu w Dockerze:

| Zmienna                       | Przeznaczenie                                                                                | Domyślnie                |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ------------------------ |
| `FLAWRAROUTE_WS_BRIDGE_SECRET`  | Współdzielony sekret mostu WebSocket. **Wymagany w produkcji** — ustaw silny, losowy ciąg.   | unset (must be provided) |
| `REDIS_URL`                   | Connection string zaplecza rate limitera / cache                                             | `redis://redis:6379`     |
| `REDIS_PORT`                  | Port po stronie hosta dla dołączonego kontenera Redis                                        | `6379`                   |
| `AUTO_UPDATE_HOST_REPO_DIR`   | Ścieżka hosta montowana w profilu `cli` pod `/workspace/flawraroute` na potrzeby self-update   | `.` (current directory)  |
| `FLAWRAROUTE_MEMORY_MB`         | Sufit heapa Node w runtime dla serwera standalone Dockera; nadpisuje fallback obrazu powyżej | `512`                    |
| `DASHBOARD_PORT` / `API_PORT` | Nadpisanie eksponowanych portów dashboardu (20128) i API (20129)                             | `20128` / `20129`        |
| `FLAWRAROUTE_BASE_PATH`         | Podścieżka URL, gdy aplikacja jest publikowana za reverse proxy (np. `/flawraroute`)           | _(empty = root)_         |
| `NEXT_PUBLIC_BASE_URL`        | Publiczny origin przeglądarki wraz z podścieżką (np. `https://host/flawraroute`)               | unset                    |
| `PROD_DASHBOARD_PORT`         | Port dashboardu po stronie hosta dla `docker-compose.prod.yml`                               | `20130`                  |
| `CLIPROXYAPI_PORT`            | Port po stronie hosta dla sidecara `cliproxyapi`                                             | `8317`                   |

## Reverse proxy na podścieżce (Traefik / nginx)

Next.js `basePath` jest kompilowany do bundla standalone. FlawraRoute zapisuje wbudowaną
wartość w pliku-sentinelu w katalogu głównym aplikacji (zapisywany podczas `npm run build`; czytany przez
`scripts/docker/ensure-docker-base-path.mjs`) i porównuje ją z
`FLAWRAROUTE_BASE_PATH` przy starcie kontenera. Gdy się różnią, a obraz był
zbudowany pod root domeny, entrypoint przepisuje manifesty standalone i osadzone
literały `basePath` zanim uruchomi się `node dev/run-standalone.mjs`.

### Build Compose (zalecane)

Ustaw obie zmienne w `.env`, potem przebuduj, aby obraz i runtime były zgodne:

```bash
# .env
FLAWRAROUTE_BASE_PATH=/flawraroute
NEXT_PUBLIC_BASE_URL=https://myhostname.example.com/flawraroute
```

```bash
docker compose --profile base up -d --build
```

`docker-compose.yml` przekazuje `FLAWRAROUTE_BASE_PATH` jako Docker build-arg oraz jako
zmienną środowiskową runtime.

### Wstępnie zbudowany obraz root + podścieżka w runtime

Opublikowane obrazy `diegosouzapw/flawraroute:*` są budowane pod root domeny. Nadal możesz
ustawić `FLAWRAROUTE_BASE_PATH` w runtime; kontener jednorazowo patchuje bundel przy starcie.
Połącz to z pasującym publicznym originem:

```yaml
services:
  flawraroute:
    image: diegosouzapw/flawraroute:latest
    environment:
      FLAWRAROUTE_BASE_PATH: /flawraroute
      NEXT_PUBLIC_BASE_URL: https://myhostname.example.com/flawraroute
```

Skonfiguruj reverse proxy tak, aby przekazywało **pełną** zewnętrzną ścieżkę (nie usuwaj
prefiksu). Traefik powinien routować `PathPrefix(`/flawraroute`)` do kontenera bez
`StripPrefix`, żeby Next.js otrzymywał `/flawraroute/...` i serwował assety z
`/flawraroute/_next/...`.

Healthcheck Dockera sonduje lekki endpoint cyklu życia `/healthz` z prefiksem aktywnego
`FLAWRAROUTE_BASE_PATH`. `/api/monitoring/health` pozostaje dostępny do diagnostyki
człowieka/pulpit; aby ustawić HEALTHCHECK kontenera z powrotem na niego (np. dla
głębokiej kontroli stanu), ustaw `FLAWRAROUTE_HEALTHCHECK_PATH=/api/monitoring/health`.

## Docker Compose z Caddy (HTTPS Auto-TLS)

FlawraRoute można bezpiecznie udostępnić dzięki automatycznemu provisionowaniu SSL w Caddy. Upewnij się, że rekord DNS A domeny wskazuje na IP Twojego serwera.

```yaml
services:
  flawraroute:
    image: diegosouzapw/flawraroute:latest
    container_name: flawraroute
    restart: unless-stopped
    volumes:
      - flawraroute-data:/app/data
    environment:
      - PORT=20128
      # Browser-facing origin for OAuth callbacks, dashboard links, and generated public URLs.
      - NEXT_PUBLIC_BASE_URL=https://your-domain.com
      # Internal server-to-server URL for scheduled jobs / self-fetches.
      - BASE_URL=http://flawraroute:20128
      - AUTH_COOKIE_SECURE=true

  caddy:
    image: caddy:latest
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    command: caddy reverse-proxy --from https://your-domain.com --to http://flawraroute:20128

volumes:
  flawraroute-data:
```

Caddy ustawia standardowe nagłówki forwardingu dla kontenera upstream. FlawraRoute używa
`NEXT_PUBLIC_BASE_URL` jako kanonicznego publicznego originu dla callbacków OAuth i generowanych publicznych
linków; uwierzytelnione zapisy dashboardu używają żądań same-origin oraz ochrony CSRF
związanej z sesją. Włączaj `FLAWRAROUTE_TRUST_PROXY` tylko w zaawansowanych wdrożeniach, gdzie świadomie
chcesz, by FlawraRoute wyprowadzał publiczny origin z zaufanych nagłówków forwarded zamiast z jawnej
konfiguracji.

## Cloudflare Quick Tunnel

Wsparcie dashboardu dla wdrożeń Dockera obejmuje one-click **Cloudflare Quick Tunnel** w `Dashboard → Endpoints`. Pierwsze włączenie pobiera `cloudflared` tylko gdy to potrzebne, uruchamia tymczasowy tunel do bieżącego endpointu `/v1` i pokazuje wygenerowany URL `https://*.trycloudflare.com/v1` bezpośrednio pod normalnym publicznym URL.

Panele tuneli endpointów (Cloudflare, Tailscale, ngrok) można pokazywać lub ukrywać w `Settings → Appearance` bez zmiany aktywnego stanu tunelu.

### Uwagi o tunelach

- URL-e Quick Tunnel są tymczasowe i zmieniają się po każdym restarcie.
- Quick Tunnels nie są automatycznie przywracane po restarcie FlawraRoute ani kontenera. Włącz je ponownie z dashboardu, gdy potrzeba.
- Managed install obecnie obsługuje Linux, macOS i Windows na `x64` / `arm64`.
- Managed Quick Tunnels domyślnie używają transportu HTTP/2, aby uniknąć hałaśliwych ostrzeżeń o buforze QUIC UDP w ograniczonych środowiskach kontenerowych. Ustaw `CLOUDFLARED_PROTOCOL=quic` lub `auto`, jeśli chcesz inny transport.
- Obrazy Dockera dołączają systemowe korzenie CA i przekazują je do managed `cloudflared`, co unika błędów zaufania TLS przy bootstrapie tunelu wewnątrz kontenera.
- Ustaw `CLOUDFLARED_BIN=/absolute/path/to/cloudflared`, jeśli chcesz, by FlawraRoute używał istniejącego binarium zamiast pobierać własne.

## Tagi obrazów

| Obraz                    | Tag      | Rozmiar | Opis                       |
| ------------------------ | -------- | ------- | -------------------------- |
| `diegosouzapw/flawraroute` | `latest` | ~250MB  | Najnowsze stabilne wydanie |
| `diegosouzapw/flawraroute` | `3.8.0`  | ~250MB  | Bieżąca wersja             |

Manifest multi-platform: natywne `linux/amd64` + `linux/arm64` (Apple Silicon, AWS Graviton, Raspberry Pi). Docker automatycznie wybiera pasującą architekturę; podaj `--platform linux/amd64`, jeśli musisz wymusić emulację AMD64 na hostach ARM.

## Ważne uwagi

- **Tryb SQLite WAL:** `docker stop` powinien móc się dokończyć, żeby FlawraRoute mógł zrobić checkpoint najnowszych zmian z powrotem do `storage.sqlite`. Dołączone pliki Compose ustawiają już 40s grace period stopu. Przy bezpośrednim uruchomieniu obrazu zachowaj `--stop-timeout 40`.
- **`DISABLE_SQLITE_AUTO_BACKUP`:** Ustaw na `true`, jeśli backupy są zarządzane zewnętrznie.
- **Trwałość danych:** Zawsze montuj wolumen pod `/app/data`, aby zachować bazę, klucze i konfiguracje między restartami kontenera.
- **Konfiguracja portu:** Nadpisz zmienną środowiskową `PORT`, aby zmienić domyślny port `20128`.

## Zobacz też

- [Przewodnik wdrożenia VM](../ops/VM_DEPLOYMENT_GUIDE.md) — konfiguracja VM + nginx + Cloudflare
- [Przewodnik wdrożenia Fly.io](../ops/FLY_IO_DEPLOYMENT_GUIDE.md) — wdrożenie na Fly.io
- [Konfiguracja środowiska](../reference/ENVIRONMENT.md) — kompletne odniesienie `.env`
