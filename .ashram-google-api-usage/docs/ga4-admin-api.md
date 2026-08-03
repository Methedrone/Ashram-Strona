# Google Analytics Admin API v1beta

**Cel:** konfiguracja property GA4, tworzenie audiences, custom dimensions, listowanie data streams.

**Autoryzacja:** service account z scope `https://www.googleapis.com/auth/analytics.edit` (albo `analytics.manage.users`).

---

## 1. Base URL i scopes

```
Base URL:    https://analyticsadmin.googleapis.com/v1beta
Auth:        Bearer <service-account-token>
Scopes:
  - https://www.googleapis.com/auth/analytics.readonly   (read)
  - https://www.googleapis.com/auth/analytics.edit       (write)
  - https://www.googleapis.com/auth/analytics.manage.users (users)
```

---

## 2. Najważniejsze metody

| Metoda | URL | Co robi |
|---|---|---|
| `accounts.list` | `GET /v1beta/accounts` | lista kont |
| `accounts.get` | `GET /v1beta/accounts/{accountId}` | info o koncie |
| `properties.list` | `GET /v1beta/properties` | list properties w koncie |
| `properties.get` | `GET /v1beta/properties/{propertyId}` | info o property |
| `dataStreams.list` | `GET /v1beta/properties/{propertyId}/dataStreams` | web/app streams |
| `customDimensions.list` | `GET /v1beta/properties/{propertyId}/customDimensions` | custom dims |
| `customDimensions.create` | `POST /v1beta/properties/{propertyId}/customDimensions` | utwórz custom dim |
| `customMetrics.list` | `GET /v1beta/properties/{propertyId}/customMetrics` | custom metryki |
| `audiences.list` | `GET /v1alpha/properties/{propertyId}/audiences` | audiences (v1alpha) |
| `audiences.create` | `POST /v1alpha/properties/{propertyId}/audiences` | utwórz audience |
| `conversionEvents.list` | `GET /v1beta/properties/{propertyId}/conversionEvents` | konwersje |
| `conversionEvents.create` | `POST /v1beta/properties/{propertyId}/conversionEvents` | oznacz event jako konwersję |

---

## 3. Use case 1: lista wszystkich properties

```bash
curl -sS "https://analyticsadmin.googleapis.com/v1beta/properties" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.properties[] | {name, id: .name.split("/")[1], type: .propertyType}'
```

## 4. Use case 2: custom dimension dla typu wydarzenia

Dodaj `event_type` (havan, joga, nauka) jako custom dimension:

```bash
PROPERTY=properties/123456789
curl -sS -X POST "https://analyticsadmin.googleapis.com/v1beta/${PROPERTY}/customDimensions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "parameterName": "event_type",
    "displayName": "Event Type",
    "description": "havan | joga | nauka | spotkanie",
    "scope": "EVENT"
  }'
```

W GA4 Data API później:
```json
{
  "dimensions": [{ "name": "customEvent:event_type" }]
}
```

## 5. Use case 3: oznacz `sign_up_havan` jako conversion event

```bash
curl -sS -X POST \
  "https://analyticsadmin.googleapis.com/v1beta/${PROPERTY}/conversionEvents" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "sign_up_havan",
    "custom": true
  }'
```

## 6. Use case 4: utwórz audience "lokalne odwiedzające Kłodzko"

```bash
curl -sS -X POST \
  "https://analyticsadmin.googleapis.com/v1alpha/${PROPERTY}/audiences" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Local visitors (Kłodzko / Wrocław)",
    "description": "Odwiedzający z PL Dolny Śląsk",
    "membershipDurationDays": 30,
    "filterClauses": [{
      "clauses": [{
        "dimension": "name",
        "stringFilter": {
          "matchType": "EXACT",
          "value": "city"
        },
        "expressions": ["Kłodzko", "Wrocław"]
      }]
    }]
  }'
```

## 7. Use case 5: data streams — Web push setup

```bash
curl -sS "https://analyticsadmin.googleapis.com/v1beta/${PROPERTY}/dataStreams" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.dataStreams[] | select(.type=="WEB_DATA_STREAM")'
```

## 8. Limity

| Zasób | Limit |
|---|---|
| Requesty / min / project | 600 |
| Custom dimensions / property | 125 (event) + 50 (user) + 25 (item) |
| Custom metrics / property | 125 |
| Audiences / property | 100 |
| Conversion events / property | 30 (free) |

---

## 9. Skrypt Node.js

```js
// scripts/ga4-admin.mjs
import { GoogleAuth } from 'google-auth-library';
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.edit'] });

async function call(method, path, body) {
  const client = await auth.getClient();
  const url = `https://analyticsadmin.googleapis.com/v1beta/${path}`;
  const res = await client.request({ url, method, data: body });
  return res.data;
}

// 1. List properties
const props = await call('GET', 'properties');
console.log(props);

// 2. Create custom dimension
const newDim = await call('POST', 'properties/123456789/customDimensions', {
  parameterName: 'event_type',
  displayName: 'Event Type',
  scope: 'EVENT',
});
console.log(newDim);
```
