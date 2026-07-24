# Nutrition Data Preflight

Date: 2026-07-24

## Goal

לבדוק מקורות חינמיים ואמינים לנתוני תזונה עבור Fit Plan, ללא שירותים בתשלום.

## Constraints

- אין להשתמש בשירות בתשלום.
- המקור צריך לספק לפחות קלוריות, חלבון, פחמימה ושומן.
- עדיפות גבוהה לתמיכה בעברית ובמוצרים/מאכלים בישראל.
- כאשר אין ודאות, המערכת צריכה לסמן "הערכה" ולאפשר תיקון.

## Sources Checked

### 1. מאגר התזונה הלאומי הישראלי

Source:

- `https://data.gov.il/api/3/action/package_show?id=nutrition-database`
- Dataset page: `https://data.gov.il/he/datasets/ministry-health/nutrition-database`

Status: usable for MVP.

Findings:

- זמין דרך CKAN API של `data.gov.il`.
- כולל resource למצרכים וערכים ל-100 גרם:
  - `c3cb0630-0650-46c1-a068-82d575c094b2`
- כולל שדות מרכזיים:
  - `shmmitzrach` - שם מצרך בעברית
  - `english_name`
  - `food_energy`
  - `protein`
  - `carbohydrates`
  - `total_fat`
  - ועוד מיקרו-נוטריינטים רבים
- כולל טבלאות יחידות מידה ומשקל:
  - `98fb46fe-e8de-4067-94d2-b0a8ea4269da`
  - `755d28c0-75f7-40e1-9c8c-ecdd106f9b2d`

Sample endpoint:

`https://data.gov.il/api/3/action/datastore_search?resource_id=c3cb0630-0650-46c1-a068-82d575c094b2&q=גבינה%20לבנה&limit=5`

Observed coverage for Noam's foods:

- גבינה לבנה: found multiple products, including brands and percentages.
- פיתה: found multiple products.
- חזה עוף: found multiple products.
- אורז: found many results, but naive search needs ranking cleanup.
- בורגול: found results.
- שייטל: found direct result.
- ביצה: found results, but naive search may prefer recipes; needs ranking cleanup.

Risks:

- Search quality is not enough by itself; requires local ranking and filtering.
- Direct CSV download from `e.data.gov.il` was blocked by browser protection in this environment, but CKAN datastore JSON works.
- Some products are branded and some are generic; app must expose uncertainty.

Verdict:

Use as primary source for MVP.

### 2. Open Food Facts

Source:

- API docs: `https://openfoodfacts.github.io/openfoodfacts-server/api/`
- Tutorial: `https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/`

Status: useful as optional fallback/cache source, not reliable as sole live dependency.

Findings from docs:

- Read API can return product data, ingredients and nutritional values.
- Product-by-barcode endpoint supports fields like `product_name` and `nutriments`.
- Read operations do not require authentication other than a proper User-Agent.
- Docs explicitly warn that data is crowdsourced and not guaranteed accurate, complete, or reliable.
- Docs list rate limits:
  - 15 product queries per minute per IP.
  - 10 search queries per minute per IP.

Live test result:

- Search endpoints returned HTTP 500/503 during preflight due to Open Food Facts server/database error.

Risks:

- Crowdsourced accuracy.
- Live API reliability.
- Rate limits make search-as-you-type unsuitable.

Verdict:

Do not use as mandatory MVP dependency. Keep as optional enrichment for branded/barcoded products if live reliability is acceptable later.

### 3. USDA FoodData Central

Source:

- `https://fdc.nal.usda.gov/`

Status: useful fallback/reference, not primary for Israeli personal app.

Findings:

- Official USDA source.
- Public domain / CC0 data.
- Strong for generic foods and US branded foods.
- Less suitable for Hebrew and Israeli products.

Verdict:

Keep as optional fallback for generic foods only if Israeli source lacks an item.

## Recommended MVP Data Strategy

1. Primary source: Israeli National Nutrition Database through CKAN datastore API.
2. Local ranking layer:
   - exact phrase boost
   - all-term match boost
   - preferred foods boost
   - branded-vs-generic classification
   - avoid recipe-heavy matches unless user entered a recipe-like item
3. Personal food cache:
   - store Noam's confirmed choices
   - use past choice as default for repeated foods
4. Unknown handling:
   - propose closest match
   - mark as "הערכה"
   - allow manual correction
5. Open Food Facts:
   - optional later enrichment for barcode/branded packaged items
   - never sole source
6. USDA:
   - optional fallback for generic foods

## Implementation Notes

Suggested normalized item shape:

- source
- sourceId
- nameHe
- nameEn
- brand
- per100g:
  - calories
  - protein
  - carbs
  - fat
- confidence
- confidenceReason
- isEstimate

## Blindspot Pass

### Known knowns

- Free reliable source exists for Israeli nutrition data.
- CKAN JSON API works.
- Search needs app-side ranking.

### Known unknowns

- Exact API latency and rate limits of data.gov.il under app usage.
- Whether branded product coverage is sufficient for Noam's common foods.
- Best ranking rules for Hebrew free-text parsing.

### Unknown knowns

- Noam's repeated choices will quickly improve matching if cached.
- The app can start useful with generic values and gradually become more personal.

### Unknown unknowns

- Future schema changes in data.gov.il resources.
- Gaps in specific packaged foods.
- Temporary data.gov.il outages.

## Decision Needed

Approved by Noam on 2026-07-24:

- Israeli National Nutrition Database as primary.
- App-side ranking and personal cache.
- Open Food Facts only optional/fallback, not required.
