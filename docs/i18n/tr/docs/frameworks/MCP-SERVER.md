---
title: "FlawraRoute MCP Sunucu Dokümantasyonu"
version: 3.8.50
lastUpdated: 2026-08-23
---

# FlawraRoute MCP Sunucu Dokümantasyonu (Türkçe)

🌐 **Languages:** 🇺🇸 [English](../../../../frameworks/MCP-SERVER.md) · 🇸🇦 [ar](../../../ar/docs/frameworks/MCP-SERVER.md) · 🇦🇿 [az](../../../az/docs/frameworks/MCP-SERVER.md) · 🇧🇬 [bg](../../../bg/docs/frameworks/MCP-SERVER.md) · 🇧🇩 [bn](../../../bn/docs/frameworks/MCP-SERVER.md) · 🇨🇿 [cs](../../../cs/docs/frameworks/MCP-SERVER.md) · 🇩🇰 [da](../../../da/docs/frameworks/MCP-SERVER.md) · 🇩🇪 [de](../../../de/docs/frameworks/MCP-SERVER.md) · 🇪🇸 [es](../../../es/docs/frameworks/MCP-SERVER.md) · 🇮🇷 [fa](../../../fa/docs/frameworks/MCP-SERVER.md) · 🇫🇮 [fi](../../../fi/docs/frameworks/MCP-SERVER.md) · 🇫🇷 [fr](../../../fr/docs/frameworks/MCP-SERVER.md) · 🇮🇳 [gu](../../../gu/docs/frameworks/MCP-SERVER.md) · 🇮🇱 [he](../../../he/docs/frameworks/MCP-SERVER.md) · 🇮🇳 [hi](../../../hi/docs/frameworks/MCP-SERVER.md) · 🇭🇺 [hu](../../../hu/docs/frameworks/MCP-SERVER.md) · 🇮🇩 [id](../../../id/docs/frameworks/MCP-SERVER.md) · 🇮🇹 [it](../../../it/docs/frameworks/MCP-SERVER.md) · 🇯🇵 [ja](../../../ja/docs/frameworks/MCP-SERVER.md) · 🇰🇷 [ko](../../../ko/docs/frameworks/MCP-SERVER.md) · 🇮🇳 [mr](../../../mr/docs/frameworks/MCP-SERVER.md) · 🇲🇾 [ms](../../../ms/docs/frameworks/MCP-SERVER.md) · 🇳🇱 [nl](../../../nl/docs/frameworks/MCP-SERVER.md) · 🇳🇴 [no](../../../no/docs/frameworks/MCP-SERVER.md) · 🇵🇭 [phi](../../../phi/docs/frameworks/MCP-SERVER.md) · 🇵🇱 [pl](../../../pl/docs/frameworks/MCP-SERVER.md) · 🇵🇹 [pt](../../../pt/docs/frameworks/MCP-SERVER.md) · 🇧🇷 [pt-BR](../../../pt-BR/docs/frameworks/MCP-SERVER.md) · 🇷🇴 [ro](../../../ro/docs/frameworks/MCP-SERVER.md) · 🇷🇺 [ru](../../../ru/docs/frameworks/MCP-SERVER.md) · 🇸🇰 [sk](../../../sk/docs/frameworks/MCP-SERVER.md) · 🇸🇪 [sv](../../../sv/docs/frameworks/MCP-SERVER.md) · 🇰🇪 [sw](../../../sw/docs/frameworks/MCP-SERVER.md) · 🇮🇳 [ta](../../../ta/docs/frameworks/MCP-SERVER.md) · 🇮🇳 [te](../../../te/docs/frameworks/MCP-SERVER.md) · 🇹🇭 [th](../../../th/docs/frameworks/MCP-SERVER.md) · 🇺🇦 [uk-UA](../../../uk-UA/docs/frameworks/MCP-SERVER.md) · 🇵🇰 [ur](../../../ur/docs/frameworks/MCP-SERVER.md) · 🇻🇳 [vi](../../../vi/docs/frameworks/MCP-SERVER.md) · 🇨🇳 [zh-CN](../../../zh-CN/docs/frameworks/MCP-SERVER.md) · 🇹🇼 [zh-TW](../../../zh-TW/docs/frameworks/MCP-SERVER.md)

---

> Yönlendirme, önbellek, sıkıştırma, bellek, yetenekler, proxy, havuz, Radar ve bağlam kaynak işlemleri genelinde 110 araç içeren Model Context Protocol (MCP) sunucusu.
>
> Doğruluk kaynağı: `open-sse/mcp-server/server.ts` dosyası `countUniqueMcpTools()` ile **110 benzersiz araç** hesaplar: 45 kurallı tanım (altı CCR yaşam döngüsü aracı, ajan yetenekleri üçlüsü, `flawraroute_radar_catalog` ve `flawraroute_x_search` dahil), artı bellek (3), yetenekler (4), GitHub yetenekleri (3), havuz (6), oyunlaştırma (8), eklentiler (8), Notion (6), Obsidian (22), yerel külliyat (3) ve iki RTK sıkıştırma aracı.

## Kurulum

FlawraRoute MCP yerleşik olarak gelir. Şununla başlatın:

```bash
flawraroute --mcp
```

Veya open-sse taşıması aracılığıyla:

```bash
# HTTP akış taşıması (port 20130)
flawraroute --dev  # MCP /mcp uç noktasında otomatik başlar
```

## Taşıma Modları (Transports)

MCP sunucusu, tümü aynı `createMcpServer()` fabrikası tarafından desteklenen üç taşıma protokolü sunar:

| Taşıma            | Konum                                       | Ne zaman kullanılır                                  |
| :---------------- | :------------------------------------------ | :--------------------------------------------------- |
| `stdio`           | `open-sse/mcp-server/server.ts`             | IDE entegrasyonları (Claude Desktop, Cursor vb.)     |
| `sse`             | `httpTransport` ile `POST/GET /api/mcp/sse` | Olay akışına ihtiyaç duyan tarayıcı/ajan istemcileri |
| `streamable-http` | `POST/GET/DELETE /api/mcp/stream`           | Çoklu oturumlu HTTP istemcileri (`mcp-session-id`)   |

Etkin HTTP taşıması (`sse` veya `streamable-http`) `mcpTransport` ayarıyla seçilir. Taşıma modunu değiştirmek diğer taşımadaki mevcut oturumları kapatır.

### Uzaktan Erişim (`manage` Kapsamı)

`/api/mcp/*` LOCAL_ONLY katmanındadır (`src/server/authz/routeGuard.ts`) — varsayılan olarak yalnızca yerel döngü ana bilgisayarları (`localhost`, `127.0.0.1`, `::1`) erişebilir. v3.8.2'den bu yana, yerel olmayan istemciler `manage` kapsamına sahip bir `Authorization: Bearer <api-key>` anahtarı sunduklarında bağlanabilirler. Bu, tünel, ters proxy veya genel ana bilgisayar adı üzerinden uzak MCP sunucusuna erişmenin tek yoludur.

```bash
# Uzak bir MCP istemcisinden bağlanın:
curl -i \
  -H "Host: your-public-host.example" \
  -H "Authorization: Bearer sk-…" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"my-client","version":"0"}}}' \
  https://your-public-host.example/api/mcp/stream
```

---

## Temel Araçlar (13) — Aşama 1

| Araç                            | Kapsamlar             | Açıklama                                                         |
| :------------------------------ | :-------------------- | :--------------------------------------------------------------- |
| `flawraroute_get_health`          | `read:health`         | Çalışma süresi, bellek, devre kesiciler, hız sınırları, önbellek |
| `flawraroute_list_combos`         | `read:combos`         | Stratejileriyle birlikte yapılandırılmış tüm kombolar            |
| `flawraroute_get_combo_metrics`   | `read:combos`         | Belirli bir kombo için performans metrikleri                     |
| `flawraroute_switch_combo`        | `write:combos`        | Bir komboyu etkinleştirme veya devre dışı bırakma                |
| `flawraroute_create_combo`        | `write:combos`        | Doğrulanmış bir kombo oluşturma                                  |
| `flawraroute_check_quota`         | `read:quota`          | Kullanılan/toplam kota, kalan yüzde, sıfırlanma süresi           |
| `flawraroute_route_request`       | `execute:completions` | FlawraRoute yönlendirmesi üzerinden sohbet tamamlama gönderme      |
| `flawraroute_cost_report`         | `read:usage`          | Döneme göre maliyet raporu (oturum/gün/hafta/ay)                 |
| `flawraroute_list_models_catalog` | `read:models`         | Yetenekler, durum ve fiyatlandırma ile tam model kataloğu        |
| `flawraroute_radar_catalog`       | `read:radar`          | Yerel imzalı Radar kataloğu; isteğe bağlı filtreler              |
| `flawraroute_tool_search`         | `read:tools`          | Kayıtlı MCP kataloğundan araçları keşfetme                       |
| `flawraroute_web_search`          | `execute:search`      | Yapılandırılmış sağlayıcılar üzerinden web araması               |
| `flawraroute_x_search`            | `execute:search`      | SuperGrok / xAI üzerinden X (Twitter) araması                    |
| `flawraroute_web_fetch`           | `execute:search`      | Yapılandırılmış getirme sağlayıcıları üzerinden web içeriği alma |

## Gelişmiş Araçlar (11) — Aşama 2

| Araç                               | Kapsamlar                            | Açıklama                                                                  |
| :--------------------------------- | :----------------------------------- | :------------------------------------------------------------------------ |
| `flawraroute_simulate_route`         | `read:health`, `read:combos`         | Geri dönüş ağacı ile yönlendirme simülasyonu (kuru çalıştırma)            |
| `flawraroute_set_budget_guard`       | `write:budget`                       | Düşürme/engelleme/uyarı eylemi ile oturum bütçesi koruması                |
| `flawraroute_set_routing_strategy`   | `write:combos`                       | Çalışma zamanında kombo stratejisini güncelleme                           |
| `flawraroute_set_resilience_profile` | `write:resilience`                   | `aggressive` / `balanced` / `conservative` dayanıklılık önayarı uygulama  |
| `flawraroute_test_combo`             | `execute:completions`, `read:combos` | Gerçek bir çağrı kullanarak kombodaki her sağlayıcıyı canlı test etme     |
| `flawraroute_get_provider_metrics`   | `read:health`                        | p50/p95/p99 gecikme ve devre kesici durumu ile sağlayıcı başına metrikler |
| `flawraroute_best_combo_for_task`    | `read:combos`, `read:health`         | Bütçe/gecikme kısıtlamalarıyla görev türüne göre kombo önerme             |
| `flawraroute_explain_route`          | `read:health`, `read:usage`          | Bir isteğin neden belirli bir sağlayıcıya yönlendirildiğini açıklama      |
| `flawraroute_get_session_snapshot`   | `read:usage`                         | Tam oturum anlık görüntüsü: maliyet, tokenlar, modeller, hatalar          |
| `flawraroute_db_health_check`        | `read:health`, `write:resilience`    | Veritabanı sapmalarını tanılama (ve isteğe bağlı otomatik onarma)         |
| `flawraroute_sync_pricing`           | `pricing:write`                      | Dış kaynaklardan (LiteLLM) fiyatlandırma verilerini senkronize etme       |

---

## Bağlam, Bellek ve Yetenek Araçları

- **Bellek Araçları:** `flawraroute_memory_search`, `flawraroute_memory_store`, `flawraroute_memory_delete`
- **Yetenek Araçları:** `flawraroute_skill_execute`, `flawraroute_skill_list`, `flawraroute_skill_register`
- **Bağlam Kaynakları:** Notion (`flawraroute_notion_*`), Obsidian (`flawraroute_obsidian_*`), Yerel Külliyat (`flawraroute_corpus_*`)
