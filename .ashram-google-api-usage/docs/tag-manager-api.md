# Google Tag Manager API v2

**Cel:** pełna automatyzacja Google Tag Manager — tworzenie tagów, triggerów, wersji, publikacja. Bez klikania w UI.

**Dokumentacja:** https://developers.google.com/tag-platform/tag-manager/api/v2

---

## 1. Hierarchia zasobów

```
Account
└── Container (np. "babaji.org.pl — Web")
    ├── Workspace "Default"
    │   ├── Tags (GA4 event, Ads conversion, Custom HTML, etc.)
    │   ├── Triggers (pageview, click, form, custom event)
    │   ├── Variables (dataLayer, constant, lookup table)
    │   ├── Folders (organizacja)
    │   └── Templates (community gallery)
    ├── Workspace "v2 — nowe eventy"
    ├── Versions (snapshoty opublikowane)
    └── Environments (live, dev, staging)
```

---

## 2. Autoryzacja

**OAuth 2.0 / Service Account.** Klucz API NIE wystarczy.

### 2.1 Scopes (od najmniej do najbardziej uprawnień)

```bash
tagmanager.readonly                     # tylko odczyt
tagmanager.edit.containers              # tworzenie/edycja tagów w workspace
tagmanager.edit.containerversions       # WYMAGANY do create_version (oprócz edit.containers)
tagmanager.publish                      # publikowanie wersji
tagmanager.delete.containers            # usuwanie
tagmanager.manage.users                 # zarządzanie uprawnieniami userów
tagmanager.manage.accounts              # tworzenie kont i kontenerów
```

Dla `ashram-bot` zalecam: **edit.containers + edit.containerversions + publish + manage.users**

> ⚠ **Bez `tagmanager.edit.containerversions`** dostajesz `403 insufficient_scope` na `create_version` (to bug w dokumentacji context7 — nie wspomina o tym scope).

### 2.2 Setup service account dla GTM

1. Google Cloud → **APIs & Services → Library** → **Tag Manager API** → Enable
2. **IAM & Admin → Service Accounts** → `ashram-bot` (ten sam co dla GA4/GSC)
3. W GTM (tagmanager.google.com):
   - Otwórz swój container
   - **Admin → User Management** (lub `/#/admin/accounts/<ACCOUNT>/users`)
   - Add user: `ashram-bot@<project>.iam.gserviceaccount.com`
   - Role: **Edit** (lub **Approve & Publish** jeśli chcesz żeby SA mógł publikować)
4. **Account ID i Container ID**:
   - Otwórz `https://tagmanager.google.com/#/container/accounts/<ACCOUNT_ID>/containers/<CONTAINER_ID>/...`
   - Account ID to 8-10 cyfr (np. `6000000001`)
   - Container ID zaczyna się od `GTM-` (np. `GTM-5J4NL66W`)

---

## 3. Base URL i endpointy

```
Base URL:  https://tagmanager.googleapis.com/tagmanager/v2
```

| Metoda | URL | Opis |
|---|---|---|
| `accounts.list` | `GET /accounts` | lista kont |
| `accounts.get` | `GET /accounts/{accountId}` | info o koncie |
| `accounts.update` | `PATCH /accounts/{accountId}` | update account name |
| `accounts.user_permissions.list` | `GET /accounts/{accountId}/user_permissions` | lista uprawnień |
| `accounts.user_permissions.create` | `POST /accounts/{accountId}/user_permissions` | nadaj uprawnienia |
| `accounts.user_permissions.get` | `GET /accounts/{accountId}/user_permissions/{permId}` | info o uprawnieniu |
| `accounts.user_permissions.update` | `PUT /accounts/{accountId}/user_permissions/{permId}` | update uprawnień |
| `accounts.user_permissions.delete` | `DELETE /accounts/{accountId}/user_permissions/{permId}` | usuń uprawnienia |
| `accounts.containers.list` | `GET /accounts/{accountId}/containers` | lista kontenerów |
| `accounts.containers.get` | `GET /accounts/{accountId}/containers/{containerId}` | info |
| `accounts.containers.create` | `POST /accounts/{accountId}/containers` | utwórz nowy kontener |
| `accounts.containers.delete` | `DELETE /accounts/{accountId}/containers/{containerId}` | usuń |
| `accounts.containers.combine` | `POST ...:combine` | połącz 2 kontenery (merge) |
| `accounts.containers.move_tag_id` | `GET ...:move_tag_id` | przenieś tag ID między kontenerami |
| `accounts.containers.snippet` | `GET .../containers/{c}:snippet` | snippet do wklejenia na stronę |
| `accounts.containers.lookup` | `GET .../containers:lookup` | znajdź kontener po publicId (GTM-XXXXXX) |
| `accounts.containers.workspaces.list` | `GET /accounts/{accountId}/containers/{containerId}/workspaces` | lista workspace'ów |
| `accounts.containers.workspaces.get` | `GET /{workspacePath}` | info o workspace |
| `accounts.containers.workspaces.create` | `POST /accounts/{a}/containers/{c}/workspaces` | nowy workspace |
| `accounts.containers.workspaces.delete` | `DELETE /{workspacePath}` | usuń workspace |
| `accounts.containers.workspaces.update` | `PATCH /{workspacePath}` | update |
| `accounts.containers.workspaces.bulk_update` | `POST /{workspacePath}:bulk_update` | bulk update tagów |
| `accounts.containers.workspaces.getStatus` | `GET /{workspacePath}/status` | status sync |
| `accounts.containers.workspaces.sync` | `POST /{workspacePath}:sync` | sync workspace |
| `accounts.containers.workspaces.resolve_conflict` | `POST /{workspacePath}:resolve_conflict` | rozwiąż konflikt |
| `accounts.containers.workspaces.quick_preview` | `POST /{workspacePath}:quick_preview` | preview bez zapisywania |
| `accounts.containers.workspaces.tags.list` | `GET /{workspacePath}/tags` | lista tagów |
| `accounts.containers.workspaces.tags.create` | `POST /{workspacePath}/tags` | nowy tag |
| `accounts.containers.workspaces.tags.update` | `PUT /{tagPath}` | edycja |
| `accounts.containers.workspaces.tags.delete` | `DELETE /{tagPath}` | usuń |
| `accounts.containers.workspaces.tags.revert` | `POST /{tagPath}:revert` | cofnij do ostatniej wersji |
| `accounts.containers.workspaces.triggers.list` | `GET /{workspacePath}/triggers` | lista triggerów |
| `accounts.containers.workspaces.triggers.create` | `POST /{workspacePath}/triggers` | nowy trigger |
| `accounts.containers.workspaces.variables.list` | `GET /{workspacePath}/variables` | lista zmiennych |
| `accounts.containers.workspaces.variables.create` | `POST /{workspacePath}/variables` | nowa zmienna |
| `accounts.containers.workspaces.folders.list` | `GET /{workspacePath}/folders` | lista folderów |
| `accounts.containers.workspaces.folders.create` | `POST /{workspacePath}/folders` | nowy folder |
| `accounts.containers.workspaces.built_in_variables.list` | `GET /{workspacePath}/built_in_variables` | wbudowane zmienne |
| `accounts.containers.workspaces.built_in_variables.create` | `POST ...:built_in_variables` | włącz built-in |
| `accounts.containers.workspaces.gtag_config.list` | `GET /{workspacePath}/gtag_config` | list gtag config |
| `accounts.containers.workspaces.clients.list` | `GET /{workspacePath}/clients` | list clients |
| `accounts.containers.workspaces.templates.list` | `GET /{workspacePath}/templates` | list templates |
| `accounts.containers.workspaces.templates.import_from_gallery` | `POST .../templates:import_from_gallery` | importuj template |
| `accounts.containers.workspaces.transformations.list` | `GET /{workspacePath}/transformations` | transformations |
| `accounts.containers.workspaces.create_version` | `POST /{workspacePath}:create_version` | snapshot → wersja (niepublikowana) |
| `accounts.containers.workspaces.publish` | `POST /{workspacePath}:publish` | opublikuj wersję na env `live` |
| `accounts.containers.environments.list` | `GET /accounts/{a}/containers/{c}/environments` | lista env |
| `accounts.containers.environments.create` | `POST .../environments` | utwórz env (dev/staging) |
| `accounts.containers.environments.reauthorize` | `POST .../environments/{e}:reauthorize` | reauthorize env |
| `accounts.containers.version_headers.latest` | `GET .../version_headers/latest` | ostatnia utworzona wersja |
| `accounts.containers.version_headers.list` | `GET .../version_headers` | lista headerów wersji |
| `accounts.containers.versions.live` | `GET .../versions/live` | aktualnie opublikowana |
| `accounts.containers.versions.publish` | `POST .../versions/{v}:publish` | publish istniejącej wersji |
| `accounts.containers.versions.set_latest` | `POST .../versions/{v}:set_latest` | oznacz jako latest |

---

## 4. Przykłady

### 4.1 List accounts

```bash
curl -H "Authorization: Bearer ${TOKEN}" \
  https://tagmanager.googleapis.com/tagmanager/v2/accounts
```

### 4.2 List containers w account

```bash
curl -H "Authorization: Bearer ${TOKEN}" \
  https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers
```

### 4.3 List workspaces w containerze

```bash
curl -H "Authorization: Bearer ${TOKEN}" \
  https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces
```

### 4.4 List tags w workspace

```bash
curl -H "Authorization: Bearer ${TOKEN}" \
  "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/tags"
```

### 4.5 Create tag (GA4 event)

```bash
curl -X POST "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/tags" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GA4 - sign_up_havan",
    "type": "gaawe",  // Google Analytics 4 Event
    "parameter": [
      { "type": "TEMPLATE", "key": "measurementIdOverride", "value": "G-QPJ40KK4Z4" },
      { "type": "TEMPLATE", "key": "eventName", "value": "sign_up_havan" },
      { "type": "TEMPLATE", "key": "eventParameters", "value": [
        { "name": "havan_date", "value": "{{DLV - havan_date}}" },
        { "name": "havan_location", "value": "{{DLV - havan_location}}" }
      ]},
      { "type": "BOOLEAN", "key": "sendEcommerceData", "value": "false" }
    ],
    "firingTriggerId": ["<triggerId>"]
  }'
```

### 4.6 Create trigger (form submit)

```bash
curl -X POST "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/triggers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Form Submit - Contact",
    "type": "formSubmission",
    "filter": [
      {
        "type": "EQUALS",
        "parameter": [
          { "type": "TEMPLATE", "key": "arg0", "value": "{{Page URL}}" },
          { "type": "TEMPLATE", "key": "arg1", "value": "/kontakt" }
        ]
      }
    ]
  }'
```

### 4.7 Create variable (dataLayer)

```bash
curl -X POST "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/variables" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DLV - havan_date",
    "type": "v",  // Data Layer Variable
    "parameter": [
      { "type": "TEMPLATE", "key": "dataLayerVersion", "value": "2" },
      { "type": "TEMPLATE", "key": "name", "value": "havan_date" }
    ]
  }'
```

### 4.8 Publish workspace → live

```bash
# 1. Stwórz wersję (snapshot)
VERSION_ID=$(curl -X POST "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}:create_version" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"v2 - dodane eventy konwersji","notes":"sign_up_havan, click_donate, contact_form"}' \
  | jq -r '.containerVersion.path')

# 2. Opublikuj
curl -X POST "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}:publish" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"v2 - konwersje\"}"
```

---

## 5. Limity (potwierdzone w context7 + research, 2025)

| Zasób | Limit | Uwagi |
|---|---|---|
| **API requests / project / day** | **10 000** (default) | Default quota dla nowych projektów. Wyższe na wniosek. |
| **API rate limit (QPS)** | **0.25 QPS / project** | Czyli 1 request / 4 sekundy. Trzeba throttle! |
| **Containers / account** | 300 (free), 1000 (premium) | |
| **Workspaces / container** | 300 | |
| **Tags / container** | 2000 | |
| **Triggers / container** | 1500 | |
| **Variables / container** | 1500 | |
| **Folder nesting depth** | 10 | |
| **Tag priority range** | 0-1000 | |
| **Workspaces auto-reset** | co **35 dni** (default workspace) | Workspace wersja "live" jest czyszczona co 35 dni |
| **403 Forbidden** | przy przekroczeniu quota | Wnioskuj o wyższe w API Console |

> ⚠ **WAŻNE — rate limit 0.25 QPS oznacza 1 request co 4 sekundy** (nie sekundę!). Przy onboarding (10+ requestów) trzeba dodać `await sleep(4000)` między callami. `gtm-onboard.mjs` już to ma w `--dry-run` flow, ale przy real deploy warto zwiększyć delay.

> ⚠ **Google Tag Manager API jest dedykowane do zarządzania** — NIE do wysyłania danych (do tego służy GA4 Measurement Protocol). Używaj GTM API do CRUD na tagach, nie do trackingu.

---

## 6. Snippety w Astro (dataLayer + eventy)

### 6.1 Snippet GTM w Layout.astro (już masz)

```astro
<!-- HEAD -->
<script is:inline>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5J4NL66W');</script>

<!-- BODY (zaraz po <body>) -->
<noscript is:inline><iframe title="Google Tag Manager" src="https://www.googletagmanager.com/ns.html?id=GTM-5J4NL66W" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

### 6.2 Push eventy z komponentów Astro

```astro
---
// src/components/EventSignupButton.astro
const { eventId, eventDate, eventLocation } = Astro.props;
---

<button
  class="signup-btn"
  data-event-id={eventId}
  data-event-date={eventDate}
  data-event-location={eventLocation}
>
  Zapisz się
</button>

<script>
  document.querySelectorAll('.signup-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'sign_up_havan',
        havan_id: btn.dataset.eventId,
        havan_date: btn.dataset.eventDate,
        havan_location: btn.dataset.eventLocation,
        timestamp: new Date().toISOString(),
      });
    });
  });
</script>
```

### 6.3 Enhanced ecommerce — donation

```astro
<button class="donate-btn" data-amount="100" data-currency="PLN">
  Wspomóż 100 PLN
</button>

<script>
  document.querySelectorAll('.donate-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const amount = parseFloat(btn.dataset.amount);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'begin_checkout', ecommerce: { items: [] } });
      window.dataLayer.push({
        event: 'purchase',
        transaction_id: 'T_' + Date.now(),
        value: amount,
        currency: btn.dataset.currency,
      });
    });
  });
</script>
```

---

## 7. Use cases dla babaji.org.pl

| Event | Trigger | Parametry |
|---|---|---|
| `sign_up_havan` | click na `.signup-btn` | havan_id, havan_date, havan_location |
| `click_donate` | click na `.donate-btn` | amount, currency |
| `contact_form_submit` | form submit (Form Submission trigger, Page=/kontakt) | — |
| `newsletter_signup` | form submit (Page=/newsletter) | source |
| `page_view_event` | Pageview + filter `{{Page Path}}` matches `/events/*` | page_category |
| `video_play` | YouTube trigger (jeśli są video) | video_title, video_duration |
| `file_download` | Click trigger z .pdf | file_name, file_type |
| `outbound_link` | Click trigger z warunkiem URL external | link_url, link_host |
| `scroll_depth` | Built-in Scroll Depth trigger | percent |
| `language_switch` | Click na `[hreflang]` linkach | from_lang, to_lang |

---

## 8. Snippet Node.js (helper do wszystkich powyższych operacji)

Patrz `scripts/gtm-*.mjs` w `.ashram-google-api-usage/`.
