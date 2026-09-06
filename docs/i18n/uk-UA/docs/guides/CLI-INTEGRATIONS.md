# CLI-INTEGRATIONS (Українська)

🌐 **Languages:** 🇺🇸 [English](../../../../guides/CLI-INTEGRATIONS.md) · 🇸🇦 [ar](../../../ar/docs/guides/CLI-INTEGRATIONS.md) · 🇦🇿 [az](../../../az/docs/guides/CLI-INTEGRATIONS.md) · 🇧🇬 [bg](../../../bg/docs/guides/CLI-INTEGRATIONS.md) · 🇧🇩 [bn](../../../bn/docs/guides/CLI-INTEGRATIONS.md) · 🇨🇿 [cs](../../../cs/docs/guides/CLI-INTEGRATIONS.md) · 🇩🇰 [da](../../../da/docs/guides/CLI-INTEGRATIONS.md) · 🇩🇪 [de](../../../de/docs/guides/CLI-INTEGRATIONS.md) · 🇪🇸 [es](../../../es/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇷 [fa](../../../fa/docs/guides/CLI-INTEGRATIONS.md) · 🇫🇮 [fi](../../../fi/docs/guides/CLI-INTEGRATIONS.md) · 🇫🇷 [fr](../../../fr/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇳 [gu](../../../gu/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇱 [he](../../../he/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇳 [hi](../../../hi/docs/guides/CLI-INTEGRATIONS.md) · 🇭🇺 [hu](../../../hu/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇩 [id](../../../id/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇹 [it](../../../it/docs/guides/CLI-INTEGRATIONS.md) · 🇯🇵 [ja](../../../ja/docs/guides/CLI-INTEGRATIONS.md) · 🇰🇷 [ko](../../../ko/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇳 [mr](../../../mr/docs/guides/CLI-INTEGRATIONS.md) · 🇲🇾 [ms](../../../ms/docs/guides/CLI-INTEGRATIONS.md) · 🇳🇱 [nl](../../../nl/docs/guides/CLI-INTEGRATIONS.md) · 🇳🇴 [no](../../../no/docs/guides/CLI-INTEGRATIONS.md) · 🇵🇭 [phi](../../../phi/docs/guides/CLI-INTEGRATIONS.md) · 🇵🇱 [pl](../../../pl/docs/guides/CLI-INTEGRATIONS.md) · 🇵🇹 [pt](../../../pt/docs/guides/CLI-INTEGRATIONS.md) · 🇧🇷 [pt-BR](../../../pt-BR/docs/guides/CLI-INTEGRATIONS.md) · 🇷🇴 [ro](../../../ro/docs/guides/CLI-INTEGRATIONS.md) · 🇷🇺 [ru](../../../ru/docs/guides/CLI-INTEGRATIONS.md) · 🇸🇰 [sk](../../../sk/docs/guides/CLI-INTEGRATIONS.md) · 🇸🇪 [sv](../../../sv/docs/guides/CLI-INTEGRATIONS.md) · 🇰🇪 [sw](../../../sw/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇳 [ta](../../../ta/docs/guides/CLI-INTEGRATIONS.md) · 🇮🇳 [te](../../../te/docs/guides/CLI-INTEGRATIONS.md) · 🇹🇭 [th](../../../th/docs/guides/CLI-INTEGRATIONS.md) · 🇹🇷 [tr](../../../tr/docs/guides/CLI-INTEGRATIONS.md) · 🇵🇰 [ur](../../../ur/docs/guides/CLI-INTEGRATIONS.md) · 🇻🇳 [vi](../../../vi/docs/guides/CLI-INTEGRATIONS.md) · 🇨🇳 [zh-CN](../../../zh-CN/docs/guides/CLI-INTEGRATIONS.md) · 🇹🇼 [zh-TW](../../../zh-TW/docs/guides/CLI-INTEGRATIONS.md)

---

---

title: "CLI Інтеграції — налаштуйте будь-який CLI для кодування на FlawraRoute"
version: 3.8.50
lastUpdated: 2026-08-18
---

# CLI Інтеграції

FlawraRoute постачається з набором команд `setup-*`, які налаштовують CLI для кодування (Codex, Claude Code, OpenCode, Cline тощо) для використання FlawraRoute як свого бекенду — таким чином, інструмент спілкується з **одним** кінцевим пунктом, а FlawraRoute маршрутизує до правильного постачальника з автоматичним резервуванням. Кожна команда читає **активний** каталог моделей з працюючого FlawraRoute (локального або віддаленого) і записує конфігураційний файл інструмента на **вашому** комп'ютері. API-ключ посилається на змінну середовища, де це підтримується інструментом. Команди, які зберігають локальний файл середовища інструмента, зазначені нижче.

Також є загальний запускник — `flawraroute run <target>` — який запускає `claude`, `codex`, `aider`, `goose`, `opencode`, `qwen` або `gemini` з правильним середовищем, без запису будь-якої конфігурації. Цілі та їхні псевдоніми беруться з канонічного маніфесту `bin/cli/cli-manifest.mjs`
(`claude-code|cc|anthropic`, `codex-cli|openai-codex|openai`, `goose-cli`,
`open-code`, `qwen-code`, `gemini-cli`), а `flawraroute completion` пропонує
ті ж слова-цілі, отримані з маніфесту. Спадкові запускники для кожного інструмента —
`flawraroute launch` (Claude Code) та `flawraroute launch-codex` (Codex) — залишаються
доступними.

Онбординг постачальників доступний з того ж локального/віддаленого контексту. Команди, орієнтовані на API, наведенні нижче, зберігають аутентифікацію управління окремо від облікових даних постачальника і ніколи не виводять облікові дані в структурованому виході:

```bash
flawraroute providers add glm --credential-env GLM_API_KEY --name work
flawraroute providers import ./providers.json --dry-run --json
flawraroute providers auth openai
flawraroute providers edit <connection-id> --default-model glm/glm-5.2
flawraroute providers remove <connection-id> --yes
```

Для скриптів надавайте перевагу `--credential-stdin` або `--credential-env`; `--credential`
залишається для контрольованого локального використання. `providers remove` вимагає `--yes` на
неінтерактивному терміналі, і всі п’ять команд поважають активний контекст або глобальні параметри `--base-url`/`--api-key`.

Для одноразового, ручного базового налаштування двох найбагатших інтеграцій, дивіться
глибокі занурення для кожного інструмента:

- [Налаштування Claude Code](./CLAUDE-CODE-CONFIGURATION.md)
- [Налаштування Codex CLI](./CODEX-CLI-CONFIGURATION.md)
- [Віддалений режим](./REMOTE-MODE.md) — керуйте віддаленим FlawraRoute (VPS / Tailnet) з вашого ноутбука
- [VS Code Copilot Chat](./VSCODE-COPILOT.md) — розширення OmniCopilot; воно також може виконувати ці
  команди `setup-*` за вас зсередини редактора

---

## Головна таблиця

Кожна команда поважає **активний контекст** (встановлений за допомогою `flawraroute connect`, див.
[Віддалений режим](./REMOTE-MODE.md)) або явні прапори `--remote <url> --api-key <key>`.
"Локальний проти віддаленого" нижче означає: без прапорів націлюється на `http://localhost:20128`;
з `--remote` (або активним віддаленим контекстом) отримує каталог з того
сервера і записує конфігурацію локально.

| Команда                    | Інструмент                            | Що вона записує                                                                                                                                                                            | Ключові прапори                                                                                                                            | Локальний проти віддаленого |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `flawraroute setup-codex`    | OpenAI Codex CLI                      | `~/.codex/<name>.config.toml` — один профіль для кожної сумісної текстової моделі (`codex --profile <name>`)                                                                               | `--remote` `--api-key` `--only` `--dry-run` `--port` `--codex-home`                                                                        | Обидва                      |
| `flawraroute setup-claude`   | Claude Code                           | `~/.claude/profiles/<name>/settings.json` — один профіль для кожної відповідної моделі (`CLAUDE_CONFIG_DIR`)                                                                               | `--remote` `--api-key` `--only` `--dry-run` `--port` `--claude-home`                                                                       | Обидва                      |
| `flawraroute setup-opencode` | OpenCode (сумісний з openai)          | `~/.config/opencode/opencode.json` — постачальник `flawraroute` з кожною моделлю каталогу (`opencode -m flawraroute/<model>`)                                                                  | `--remote` `--api-key` `--only` `--model` `--dry-run` `--port`                                                                             | Обидва                      |
| `flawraroute setup-cline`    | Cline                                 | `~/.cline/data/{globalState,secrets}.json` (CLI режим) + виводить налаштування розширення VS Code                                                                                          | `--remote` `--api-key` `--model` `--yes` `--dry-run` `--port` `--cline-dir`                                                                | Обидва                      |
| `flawraroute setup-kilo`     | Kilo Code                             | `~/.local/share/kilo/auth.json` (CLI) + об'єднує `kilocode.*` у `settings.json` VS Code, якщо він присутній                                                                                | `--remote` `--api-key` `--model` `--yes` `--dry-run` `--port` `--auth-path` `--vscode-settings`                                            | Обидва                      |
| `flawraroute setup-continue` | Continue / `cn` CLI                   | `~/.continue/config.yaml` — моделі `provider: openai`, ключ через `${{ secrets.FLAWRAROUTE_API_KEY }}`                                                                                       | `--remote` `--api-key` `--only` `--dry-run` `--port` `--config-path`                                                                       | Обидва                      |
| `flawraroute setup-cursor`   | Cursor                                | Нічого — виводить кроки в додатку (конфігурація Cursor є непрозорою SQLite)                                                                                                                | `--remote` `--api-key` `--only` `--port`                                                                                                   | Обидва                      |
| `flawraroute setup-roo`      | Roo Code                              | `~/.flawraroute/roo-settings.json` (імпортний документ) + встановлює `roo-cline.autoImportSettingsPath`, якщо існує `settings.json` VS Code                                                  | `--remote` `--api-key` `--model` `--yes` `--dry-run` `--port` `--import-path` `--vscode-settings`                                          | Обидва                      |
| `flawraroute setup-crush`    | Crush                                 | `~/.config/crush/crush.json` — постачальник `openai-compat`, ключ через `$FLAWRAROUTE_API_KEY`                                                                                               | `--remote` `--api-key` `--only` `--dry-run` `--port` `--config-path`                                                                       | Обидва                      |
| `flawraroute setup-goose`    | Goose                                 | `~/.config/goose/config.yaml` (`GOOSE_PROVIDER`/`OPENAI_HOST`/`GOOSE_MODEL`) + виводить рецепт середовища                                                                                  | `--remote` `--api-key` `--model` `--yes` `--dry-run` `--port` `--config-path`                                                              | Обидва                      |
| `flawraroute setup-aider`    | Aider                                 | `~/.aider.conf.yml` (`openai-api-base` + `model: openai/<id>`) + виводить рецепт середовища                                                                                                | `--remote` `--api-key` `--model` `--yes` `--dry-run` `--port` `--config-path`                                                              | Обидва                      |
| `flawraroute setup-qwen`     | Qwen Code                             | `~/.qwen/settings.json` — масив V4 `modelProviders.openai` + `FLAWRAROUTE_API_KEY` у `~/.qwen/.env`                                                                                          | `--remote` `--api-key` `--model` `--yes` `--dry-run` `--port` `--config-path` `--env-path`                                                 | Обидва                      |
| `flawraroute run <target>`   | Запуск в режимі виконання (загальний) | Нічого — запускає `claude`/`codex`/`aider`/`goose`/`opencode`/`qwen`/`gemini` з правильним середовищем і аргументами; Qwen і Gemini використовують тимчасовий ізольований домашній каталог | `--remote` `--base-url` `--context` `--provider` `--model` `--api-key` `--api-key-env` `--dry-run` `--json` `--port` `--profile` `--token` | Обидва                      |
| `flawraroute launch`         | Claude Code                           | Нічого — запускає `claude` з `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN` інжектованими                                                                                                     | `--remote` `--api-key` `--token` `--profile` `--port`                                                                                      | Обидва                      |
| `flawraroute launch-codex`   | OpenAI Codex CLI                      | Нічого — запускає `codex` з постачальником `flawraroute`, інжектованим через `-c` прапори                                                                                                    | `--remote` `--api-key` `--profile` (`-p`) `--port`                                                                                         | Обидва                      |

Примітки щодо прапорів (перевірено в джерелі команди):

- `--remote <url>` — отримати каталог з віддаленого FlawraRoute (перезаписує `--port`
  і активний контекст). `--api-key <key>` постачає облікові дані для цього
  сервера (за замовчуванням використовує змінну середовища `FLAWRAROUTE_API_KEY` або токен активного контексту).
- `--only <patterns>` — підрядки, розділені комами; зберігайте лише ідентифікатори моделей, які відповідають
  (наприклад, `--only glm,kimi`). Доступно для `setup-codex`, `setup-claude`,
  `setup-opencode`, `setup-continue`, `setup-cursor`, `setup-crush`.
- `--dry-run` — виводить точно те, що буде записано, не торкаючись
  файлової системи. Доступно для кожної команди `setup-*` **крім** `setup-cursor`
  (яка ніколи не записує файл).
- `--model <id>` — обов'язковий (або вибраний інтерактивно) для інструментів, які не мають
  автоматичного виявлення моделей: Cline, Kilo, Roo, Goose, Qwen, Aider. Ці інструменти
  також приймають `--yes` для неінтерактивних запусків (які тоді вимагають `--model`).
  `setup-opencode` приймає `--model`, щоб встановити модель за замовчуванням на верхньому рівні.
- `--model <id>` на `flawraroute run` слідує за підключенням маніфесту для кожної цілі
  (`bin/cli/cli-manifest.mjs`): **aider** отримує `--model openai/<id>` і
  **opencode** `--model flawraroute/<id>` (префікс додається лише тоді, коли id
  вже не містить його); **qwen** і **gemini** отримують id без змін;
  **claude** отримує його через `ANTHROPIC_MODEL`, **goose** через `GOOSE_MODEL`, а
  **codex** через `-c model_providers.flawraroute.*` аргументи. **Qwen є єдиною ціллю запуску,
  яка жорстко вимагає `--model`** — `flawraroute run qwen` без нього завершується
  з кодом `2` з явною помилкою.
- `--port <port>` — локальний порт FlawraRoute (за замовчуванням `20128`, ігнорується, коли встановлено `--remote`).
  Присутній у всіх командах `setup-*` і обох запускниках.
- Код виходу `flawraroute run`: код виходу дочірнього CLI передається
  без змін; `2` = недійсні аргументи (непідтримувана ціль, відсутній обов'язковий
  `--model`, контейнерний захист); `127` = цільовий двійковий файл не в `PATH`;
  `130`/`143`/`129` коли запуск закінчується `SIGINT`/`SIGTERM`/`SIGHUP`;
  `1` = інша помилка запуску.
- Обидва запускники (`launch`, `launch-codex`) приймають `--profile <name>`, щоб вибрати
  профіль, написаний `setup-claude` / `setup-codex`, плюс аргументи для
  підлеглого двійкового файлу `claude` / `codex`.

Інтерактивний вибір також спільний для рецептів налаштування:

```bash
# Виберіть з активного локального або віддаленого каталогу моделей і налаштуйте ціль.
flawraroute configure claude
flawraroute configure opencode --provider glm
flawraroute configure qwen --model qwen/qwen3.8-max-preview --yes
```

`configure` наразі делегує до перевірених рецептів для `codex`, `claude`,
`opencode`, `qwen`, `aider`, `goose`, `cline`, `continue` та `kilo`. Записи каталогу, призначені лише для IDE,
MITM та лише для посібників, залишаються явними `setup-*`/ручними потоками і
не представлені як цілі для запуску.

> `setup-opencode` є **легковажною сумісною з openai** інтеграцією OpenCode.
> Існує також більш багатша інтеграція плагіна — `flawraroute setup opencode` — яка
> встановлює `@flawraroute/opencode-plugin`. Це різні команди; таблиця
> вище документує `setup-opencode`.

---

## Локальне використання

З FlawraRoute, що працює на `localhost:20128`, просто виконайте команду налаштування для вашого інструменту. Каталог отримується з локального сервера.

```bash
# Codex: записати профіль для кожної відповідної моделі в ~/.codex/
flawraroute setup-codex
codex --profile glm52            # використати згенерований профіль

# Claude Code: записати профілі для кожної моделі, а потім запустити одну
flawraroute setup-claude
flawraroute launch --profile glm52

# OpenCode: записати постачальника, сумісного з openai, з усіма моделями каталогу
flawraroute setup-opencode
export FLAWRAROUTE_API_KEY=sk-...  # посилається через {env:FLAWRAROUTE_API_KEY}, ніколи не на диску
opencode -m flawraroute/glm/glm-5.2 "..."

# Інструменти без автоматичного виявлення потребують явної моделі:
flawraroute setup-aider --model glm/glm-5.2
flawraroute setup-qwen --model qwen/qwen3.8-max-preview

# Попередній перегляд без запису чогось:
flawraroute setup-continue --dry-run
```

Запустіть без запису будь-якої конфігурації (тільки ін'єкція змінних середовища):

```bash
flawraroute launch                 # Claude Code → локальний FlawraRoute
flawraroute launch-codex           # Codex CLI → локальний FlawraRoute
flawraroute launch-codex --profile glm52
flawraroute run claude --model openai/gpt-5.4
flawraroute run codex --model openai/gpt-5.4 --dry-run --json
flawraroute run aider --model glm/glm-5.2 -- --message "reply OK"
flawraroute run goose --model glm/glm-5.2
flawraroute run opencode --model glm/glm-5.2 -- run "reply OK"
flawraroute run qwen --model glm/glm-5.2 -- -p "reply OK"
flawraroute run gemini --model glm/glm-5.2 -- --skip-trust -p "reply OK"

# Явний шлях команди: передати все, що йде після --
flawraroute run claude -- --print-system-prompt "review this diff"
```

---

## Віддалене використання

Вкажіть будь-яку команду налаштування на віддалений FlawraRoute з `--remote` + `--api-key`. Каталог отримується з віддаленого сервера; конфігурація записується на вашому локальному комп'ютері.

```bash
# OpenCode проти віддаленого VPS, зберегти лише моделі glm/kimi
flawraroute setup-opencode --remote http://192.168.0.15:20128 --api-key oma_live_xxx \
  --only glm,kimi
opencode -m flawraroute/glm/glm-5.2 "..."   # спочатку експортуйте FLAWRAROUTE_API_KEY

# Профілі Codex з віддаленого каталогу
flawraroute setup-codex --remote http://192.168.0.15:20128 --api-key oma_live_xxx

# Запустіть CLI безпосередньо проти віддаленого
flawraroute launch       --remote http://192.168.0.15:20128 --api-key oma_live_xxx
flawraroute launch-codex --remote http://192.168.0.15:20128 --api-key oma_live_xxx
```

Замість того, щоб передавати `--remote`/`--api-key` щоразу, увійдіть один раз і дозвольте **активному контексту** автоматично їх постачати:

```bash
flawraroute connect 192.168.0.15        # створює токен з обмеженим доступом, зберігає контекст
flawraroute setup-codex                 # ← тепер використовує віддалений каталог
flawraroute setup-opencode              # ← те ж саме
flawraroute launch                      # ← Claude Code проти віддаленого
```

Дивіться [Віддалений режим](./REMOTE-MODE.md) для контекстів, обсягів і управління токенами.

---

## Конвенції базового URL (які інструменти хочуть `/v1`)

FlawraRoute надає поверхню OpenAI за адресою `/v1`, поверхню Anthropic на кореневому рівні, і рідну поверхню Gemini за адресою `/v1beta`. Кожна інтеграція підключена до форми, яку очікує її інструмент (перевірено в джерелі команди):

| Інтеграція                                                                 | Записаний базовий URL | `/v1`?                                    |
| -------------------------------------------------------------------------- | --------------------- | ----------------------------------------- |
| `setup-cline` (`openAiBaseUrl`)                                            | корінь                | Ні — Cline додає `/v1/chat/completions`   |
| `setup-goose` (`OPENAI_HOST`)                                              | корінь                | Ні — Goose додає шлях                     |
| `setup-aider` (`OPENAI_API_BASE`)                                          | корінь                | Ні — LiteLLM додає `/v1/chat/completions` |
| `setup-kilo`, `setup-roo`, `setup-continue`, `setup-crush`, `setup-cursor` | з `/v1`               | Так                                       |
| `setup-claude` (`ANTHROPIC_BASE_URL`), `launch`                            | корінь                | Ні — Claude Code додає `/v1/messages`     |
| `setup-codex`, `launch-codex` (`model_providers.flawraroute.base_url`)       | з `/v1`               | Так                                       |
| `setup-qwen` (`modelProviders.openai[].baseUrl`)                           | з `/v1`               | Так                                       |
| `run gemini` (`GOOGLE_GEMINI_BASE_URL`)                                    | корінь                | Ні — SDK додає `/v1beta/models/…`         |

---

## Підтримка нативних залежностей під час оновлення: `--include=optional`

Коли ви оновлюєте за допомогою `flawraroute update` (після підтвердження або з `--apply`),
FlawraRoute виконує установку з `--include=optional`, вбудованим у команду:

```bash
npm install -g flawraroute@latest --include=optional
```

Це **не** прапорець, який ви передаєте до `flawraroute update` — він завжди застосовується
оновлювачем. Це гарантує, що `optionalDependencies` (`better-sqlite3`, `keytar`,
`tls-client`, стек LLMLingua SLM) залишаться після оновлення, навіть якщо ваша конфігурація npm
має `omit=optional`, що інакше тихо видалило б нативний драйвер SQLite
та прив'язку до ОС-ключа. Щоб попередньо переглянути точну команду без застосування:

```bash
flawraroute update --dry-run
# [DRY RUN] Виконало б: npm install -g flawraroute@latest --include=optional
```

Інші прапорці `flawraroute update` (перевірені в коді): `--check` (вихід 1, якщо
застаріло), `--apply` (встановити без запиту), `--changelog`, `--no-backup`,
`--yes`.

---

## Google Gemini CLI через `flawraroute run gemini`

Контракт перевірено на `@google/gemini-cli` 0.50.0: CLI поважає
`GOOGLE_GEMINI_BASE_URL` і виконує `POST /v1beta/models/<model>:generateContent`
(та `:streamGenerateContent?alt=sse`) проти нього — точно так само, як і нативна
Gemini поверхня FlawraRoute (`/v1beta`). `flawraroute run gemini` автоматично підключає це:

- `GOOGLE_GEMINI_BASE_URL` → активна базова URL-адреса FlawraRoute (корінь, без `/v1`);
- `GEMINI_API_KEY` → розв'язаний обліковий запис FlawraRoute (опція/середовище/контекст);
- **тимчасовий ізольований `GEMINI_CLI_HOME`**, чий `.gemini/settings.json`
  вибирає автентифікацію `gemini-api-key`, тому збережена сесія Google OAuth (Code Assist)
  ніколи не перекриває запуск, спрямований FlawraRoute — видаляється після виходу;
- **гігієна середовища**: дочірнє середовище очищається від `GOOGLE_API_KEY`,
  `GOOGLE_GENAI_USE_VERTEXAI` та `GOOGLE_GENAI_USE_GCA` (які перенаправляли б
  автентифікацію на Vertex/Code Assist), а `GEMINI_DEFAULT_AUTH_TYPE=gemini-api-key` є
  встановленим як запасний варіант — інші цілі `run` отримують таке ж
  оброблення для своїх конфліктуючих змінних;
- ін'єкція `--model <id>` з `--provider`/`--model`.

```bash
flawraroute run gemini --model glm/glm-5.2 -- --skip-trust -p "hello"
```

Охорона довіри до робочого простору Gemini все ще застосовується в безголовому режимі — передайте
`--skip-trust` (або довірте директорії інтерактивно) самостійно; завантажувач
умисно не обходить це. Цей завантажувач відрізняється від **реєстрації ACP**
(`src/lib/acp/registry.ts`, `gemini --acp`), яка залишається інтеграцією агент-протоколу для `/dashboard/acp-agents`.

---

## Реальний димовий тест (за бажанням)

Детерміновані регресійні запуски плану в CI (`tests/unit/cli/run-command.test.ts`,
`tests/unit/cli/run-execution.test.ts`). Щоб перевірити РЕАЛЬНІ бінарники проти РЕАЛЬНОГО
сервера FlawraRoute, існує опційний хардвер у
`tests/integration/upstream-cli-smoke.int.test.ts`. Він ніколи не виконується автоматично
(кожен під-тест пропускається, якщо `RUN_CLI_SMOKE=1`), передає облікові дані через змінну середовища
NAME (ніколи за значенням), редагує рядки у формі ключа з будь-якого записаного виходу, пропускає
цілі, бінарники яких не встановлені, і класифікує збої як
автентифікація / верхній рівень / конфігурація замість простого булевого значення:

```bash
RUN_CLI_SMOKE=1 \
FLAWRAROUTE_SMOKE_BASE_URL="http://localhost:20128" \
FLAWRAROUTE_SMOKE_MODEL="<provider/model>" \
FLAWRAROUTE_SMOKE_API_KEY_ENV="FLAWRAROUTE_API_KEY" \
node --import tsx/esm --test tests/integration/upstream-cli-smoke.int.test.ts
```

Опційно: `FLAWRAROUTE_SMOKE_TARGETS="codex,opencode,qwen"` обмежує тестування;
`FLAWRAROUTE_SMOKE_TIMEOUT_MS` перевизначає тайм-аут 120с на ціль.

## Дивіться також

- [Конфігурація Claude Code](./CLAUDE-CODE-CONFIGURATION.md) — поглиблений посібник з Claude Code
- [Конфігурація Codex CLI](./CODEX-CLI-CONFIGURATION.md) — одноразова базова налаштування `[model_providers.flawraroute]`
- [Віддалений режим](./REMOTE-MODE.md) — контексти, токени доступу з обмеженнями, управління віддаленим сервером
- [Довідка по інструментах CLI](../reference/CLI-TOOLS.md) — повний каталог підтримуваних інструментів + сторінки панелі управління
- [Посібник з налаштування](./SETUP_GUIDE.md) — методи встановлення та первинне введення в експлуатацію
