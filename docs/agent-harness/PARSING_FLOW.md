# Meal Parsing Flow

Date: 2026-07-24

## Goal

להפוך משפט בעברית חופשית כמו:

`אכלתי פיתה עם חביתה מ-2 ביצים, קצת גבינה לבנה וזעתר`

לרשומת ארוחה עם פריטים, כמויות, קלוריות ומאקרו.

## MVP Principle

לא מנסים להיות מושלמים. מנסים להיות מהירים, שקופים, וניתנים לתיקון.

## Flow

1. User enters free text.
2. Normalize text.
3. Split into candidate food phrases.
4. Extract quantities and units.
5. Search Israeli Nutrition Database.
6. Rank matches.
7. Apply personal cache.
8. Return review draft.
9. User confirms/corrects.
10. Save confirmed meal and learn choices.

## Normalization

- Remove filler words:
  - אכלתי
  - שתיתי
  - עם
  - קצת
  - בערך
- Normalize numbers:
  - `2`, `שתי`, `שני`, `זוג`
- Normalize units:
  - גרם
  - כף
  - כפית
  - יחידה
  - פרוסה
  - פיתה
  - ביצה
- Keep useful descriptors:
  - אחוז שומן
  - מלא/לבן
  - מבושל/לא מבושל
  - מותג אם קיים

## Quantity Rules

Examples:

- `2 ביצים` -> quantity: 2 units, item: ביצה
- `100 גרם חזה עוף` -> quantity: 100g, item: חזה עוף
- `פיתה אחת` -> quantity: 1 unit, item: פיתה
- `קצת גבינה לבנה` -> ambiguous quantity, ask/estimate

## Search Strategy

Primary endpoint:

`https://data.gov.il/api/3/action/datastore_search?resource_id=c3cb0630-0650-46c1-a068-82d575c094b2&q={query}&limit=10`

Use only server-side. Client calls our API, not data.gov.il directly.

## Ranking Strategy

Score candidates by:

- exact phrase match
- all input tokens appear
- important tokens appear early
- percentage/fat descriptors match
- previous confirmed selection
- preferred food list
- generic item match

Penalties:

- recipe/dish match when user entered simple ingredient
- unrelated extra tokens
- missing macro values
- allergen conflict
- kosher conflict inside menu planning

## Review Draft Shape

```json
{
  "freeText": "פיתה עם חביתה מ-2 ביצים וקצת גבינה לבנה",
  "items": [
    {
      "inputPhrase": "פיתה",
      "selected": {
        "nameHe": "פיתה",
        "source": "israeli_nutrition_db",
        "per100g": {
          "calories": 218,
          "protein": 8,
          "carbs": 45,
          "fat": 1
        }
      },
      "quantity": {
        "value": 1,
        "unit": "unit",
        "grams": null,
        "needsConfirmation": true
      },
      "confidence": 0.78,
      "isEstimate": true,
      "alternatives": []
    }
  ],
  "totals": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0
  }
}
```

## User Correction Behavior

- If product is ambiguous, show 3-5 choices.
- If quantity is ambiguous, ask for quantity or use default with "הערכה".
- If Noam corrects, save correction in personal cache.
- Next time, prefer the corrected item.

## Safety Rules

- Never suggest peach.
- In menu planning, never combine meat and dairy.
- If source confidence is low, show "הערכה".
- Do not present nutritional results as medical advice.

## First Test Sentences

- `אכלתי פיתה עם חביתה מ-2 ביצים וקצת גבינה לבנה וזעתר`
- `אכלתי אורז עם חזה עוף`
- `אכלתי בורגול ושייטל`
- `שתיתי קפה עם חלב`
- `אכלתי שטויות בערב`

## Open Questions

- האם "קצת גבינה לבנה" יקבל default grams, ואם כן כמה?
- האם פיתה אחת מקבלת default grams מטבלת יחידות מידה או אישור ידני?
- האם "שטויות" הופך לפתיחת מסך בחירה מהירה של נשנושים נפוצים?
