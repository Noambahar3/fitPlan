# Technical Architecture

Date: 2026-07-24

## Goal

לתכנן ארכיטקטורה פשוטה ל-PWA אישי לניהול תזונה ומשקל, עם שרת לשמירת נתונים ושימוש במאגר התזונה הלאומי הישראלי כמקור ראשי.

## Blindspot Pass

### Known knowns

- PWA אישי, mobile-first, בעברית ו-RTL.
- משתמש אחד בלבד.
- נתונים נשמרים על שרת.
- אין login ב-MVP.
- מקור תזונה ראשי: data.gov.il.
- אין שירותים בתשלום.

### Known unknowns

- יעד hosting סופי.
- האם נרצה offline מלא או רק cache בסיסי.
- האם data.gov.il יהיה מהיר מספיק לקריאות live.
- כמה חזק צריך להיות מנגנון ההגנה בלי login.

### Unknown knowns

- מאגר אישי יפחית מאוד תלות בחיפוש חוזר.
- שימוש בטלפון דורש פחות מסכים ויותר פעולות מהירות.
- ערב/נשנושים הוא צורך מוצרי חשוב, לא רק דאטה.

### Unknown unknowns

- תקלות זמניות ב-data.gov.il.
- שינויים בסכמה של CKAN resources.
- צורך עתידי בהתקנה על מכשיר נוסף.

## Existing Solutions Preflight

### PWA / frontend

Recommendation: Vite + React + TypeScript.

Why:

- קל ומהיר לפרויקט אישי.
- תמיכה טובה ב-PWA דרך service worker.
- מתאים ל-RTL/mobile-first.
- לא דורש תשלום.

### Backend

Recommendation: Node.js + Fastify or Express.

Preference: Fastify if starting from scratch.

Why:

- API קטן וברור.
- ביצועים טובים.
- מתאים לפרוקסי מול data.gov.il ולשמירת נתונים.
- TypeScript friendly.

### Database

Recommendation: SQLite for MVP.

Why:

- מספיק למשתמש יחיד.
- קל לגיבוי.
- לא דורש שירות חיצוני.
- פשוט להעברה ל-Postgres בעתיד אם צריך.

### Charts

Recommendation: Recharts or lightweight SVG/custom chart.

Why:

- גרף משקל פשוט לא דורש ספרייה כבדה.
- אם UI יהיה React, Recharts נוח.
- אפשר להתחיל ב-SVG custom כדי לשמור על bundle קטן.

### NLP / parsing

Recommendation: custom deterministic parser for MVP.

Why:

- אין פתרון מוכן שמבין טוב עברית, כמויות, מאכלים ישראליים וכשרות.
- הבעיה הראשונית מוגבלת: טקסט חופשי קצר של ארוחה.
- parser קטן + תיקון ידני עדיף על תלות כבדה ולא שקופה.

## Proposed Architecture

### Client PWA

- Dashboard
- Add meal text input
- Meal parse review screen
- Weight entry
- Weight graph
- Settings/profile

### Server API

- `GET /api/health`
- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/meals/parse`
- `POST /api/meals`
- `GET /api/meals?date=YYYY-MM-DD`
- `PATCH /api/meals/:id`
- `DELETE /api/meals/:id`
- `POST /api/weights`
- `GET /api/weights`
- `GET /api/nutrition/search?q=...`

### Data Source Adapter

- `IsraeliNutritionAdapter`
  - calls CKAN datastore API
  - normalizes fields
  - adds source metadata
  - handles timeouts/errors

### Ranking Layer

- exact phrase score
- all tokens score
- preferred food score
- previous confirmed choice score
- penalize recipe-like matches unless input is recipe-like
- penalize irrelevant tokens

### Personal Cache

- confirmed foods
- aliases
- default quantities
- preferred brands/products
- corrections history

## Suggested Folder Structure

```text
fit-plan/
  apps/
    web/
      src/
  server/
    src/
      api/
      nutrition/
      parsing/
      db/
  docs/
    agent-harness/
  data/
    fit-plan.sqlite
```

## Security Position For MVP

No login per Noam's decision, but still:

- Do not expose destructive endpoints casually.
- Prefer secret/unlisted URL or minimal server token for write endpoints if deployment makes it public.
- Keep private repo.
- No third-party paid APIs.

## Decision Needed

Approve initial stack:

- Vite + React + TypeScript PWA
- Node.js + Fastify API
- SQLite database
- custom parser/ranking layer
