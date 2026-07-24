# Fit Plan Worklog

## Entry Template

- Date:
- Objective:
- Context:
- Changes:
- Decisions:
- Risks:
- Verification:
- Next:

## 2026-07-24 - Initial Discovery And Harness

- Objective: להתחיל אפיון Fit Plan וליצור harness מבודד לפרויקט.
- Context: נועם ביקש לעבוד בפרויקט נפרד ולא להיכנס לפרויקטים אחרים. לאחר מכן אישר להסתכל על מבנה harness מפרויקטים אחרים בלי להדליף או להעתיק תוכן.
- Changes: נוצרה תיקיית פרויקט `/home/noam/.openclaw/workspace/fit-plan` ונוצר harness תחת `docs/agent-harness`.
- Decisions:
  - PWA אישי לטלפון של נועם.
  - שמירת נתונים על שרת.
  - ללא login ב-MVP.
  - MVP מתמקד בתזונה, משקל, קלוריות ומאקרו.
  - רישום אוכל בעברית חופשית.
  - יעד: ירידה מ-128 ק"ג ל-100 ק"ג.
  - כשרות בשר/חלב ואלרגיה לאפרסק.
- Risks:
  - מקור נתוני תזונה למוצרים ישראליים עדיין לא נבחר.
  - פירוק טקסט חופשי עלול להיות לא מדויק.
  - שימוש בלי login עדיין דורש זהירות בסיסית.
- Verification: מסמכי harness נוצרו בתוך תיקיית fit-plan בלבד.
- Next: לבצע preflight מקורות תזונה ולהציע סטאק טכני.

## 2026-07-24 - Nutrition Data Cost Constraint

- Objective: לתעד החלטה לגבי מקורות נתוני תזונה.
- Context: נועם הבהיר שאינו רוצה לשלם על שום דבר באפליקציה.
- Decisions:
  - להשתמש רק במקורות חינמיים ואמינים.
  - לא לשלב שירותי API בתשלום ב-MVP.
  - להעדיף מאגר ממשלתי/פתוח ומאגר אישי של בחירות קודמות.
- Risks:
  - כיסוי מוצרים ממותגים בישראל עלול להיות חלקי.
  - מקורות פתוחים עשויים לדרוש תיקון ידני וסימון אי-ודאות.
- Next: לבדוק בפועל מקורות חינמיים ולהציע בחירה ל-MVP.

## 2026-07-24 - Unknown Food Match UX Decision

- Objective: לתעד איך מתנהגים כשאין מוצר מדויק במאגר.
- Decision: להשתמש בגישה משולבת: הצעה אוטומטית עם סימון "הערכה" ואפשרות תיקון ידני.
- Rationale: שומר על שימוש מהיר בלי להסתיר אי-ודאות.
- Next: להכניס את ההתנהגות הזאת לזרימת רישום ארוחה ולבדיקות הקבלה.

## 2026-07-24 - Nutrition Data Preflight

- Objective: לבדוק בפועל מקורות חינמיים ואמינים לנתוני תזונה.
- Changes:
  - נוסף `NUTRITION_DATA_PREFLIGHT.md`.
  - תועדו תוצאות בדיקת data.gov.il, Open Food Facts ו-USDA FoodData Central.
- Findings:
  - מאגר התזונה הלאומי הישראלי זמין דרך CKAN datastore JSON ומתאים כמקור ראשי.
  - Open Food Facts מתאים רק כאופציונלי/העשרה, לא כתלות live חובה.
  - USDA מתאים רק כפולבאק גנרי, לא כמקור ישראלי ראשי.
- Decision approved by Noam:
  - להשתמש במאגר התזונה הלאומי הישראלי כמקור MVP ראשי.
  - לבנות שכבת ranking ואישור משתמש.
  - לשמור בחירות אישיות לשימוש חוזר.
- Next: לעבור לתכנון סטאק/ארכיטקטורה וזרימת parsing ראשונית.

## 2026-07-24 - Architecture And Parsing Draft

- Objective: להכין תכנון טכני ראשוני לפני בניית קוד.
- Changes:
  - נוסף `TECHNICAL_ARCHITECTURE.md`.
  - נוסף `PARSING_FLOW.md`.
- Proposed stack:
  - Vite + React + TypeScript PWA.
  - Node.js + Fastify API.
  - SQLite database.
  - custom deterministic parser and ranking layer.
- Risks:
  - parser עברית יצטרך שיפור איטרטיבי לפי שימוש אמיתי.
  - data.gov.il search דורש ranking ולא מספיק כמות שהוא.
- Next: לקבל אישור stack/flow ואז להתחיל שלד פרויקט וקוד MVP ראשון.

## 2026-07-24 - First Code Scaffold

- Objective: להתחיל שלד קוד MVP לאחר אישור stack.
- Changes:
  - נוסף root npm workspace.
  - נוסף `apps/web` עם Vite + React + TypeScript.
  - נוסף `server` עם Fastify + TypeScript.
  - נוסף endpoint `POST /api/meals/parse`.
  - נוסף endpoint `GET /api/nutrition/search`.
  - parser ראשוני מחלק טקסט עברי לפריטים בסיסיים ומחפש ב-data.gov.il.
- Verification:
  - `npm install` הצליח ללא vulnerabilities.
  - `npm run check` עבר.
  - `npm run build` עבר.
  - `POST /api/meals/parse` נבדק עם "פיתה עם חביתה מ-2 ביצים וקצת גבינה לבנה".
  - Vite dev server עלה ב-`http://localhost:5174/`.
  - API health החזיר `{ "ok": true }`.
- Risks:
  - חישוב כמויות עדיין לא ממומש; הערכים כרגע ל-100 גרם.
  - UI הוא שלד ראשוני בלבד.
  - אין עדיין שמירה ל-SQLite.
- Next:
  - להוסיף SQLite schema ושמירת meal/weight.
  - להוסיף quantity handling.
  - לשפר מסך אישור/בחירה.
