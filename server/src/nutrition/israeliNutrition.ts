export type NutritionCandidate = {
  source: "israeli_nutrition_db";
  sourceId: string;
  nameHe: string;
  nameEn: string | null;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  rawScore: number;
  confidenceReason: string[];
};

type DataGovRecord = {
  Code?: number;
  shmmitzrach?: string;
  english_name?: string;
  food_energy?: number | string | null;
  protein?: number | string | null;
  carbohydrates?: number | string | null;
  total_fat?: number | string | null;
};

const RESOURCE_ID = "c3cb0630-0650-46c1-a068-82d575c094b2";
const DATA_GOV_ENDPOINT = "https://data.gov.il/api/3/action/datastore_search";

export async function searchNutrition(query: string): Promise<NutritionCandidate[]> {
  const url = new URL(DATA_GOV_ENDPOINT);
  url.searchParams.set("resource_id", RESOURCE_ID);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "fit-plan/0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`data.gov.il returned ${response.status}`);
  }

  const payload = await response.json() as { success: boolean; result?: { records?: DataGovRecord[] } };
  if (!payload.success) return [];

  return (payload.result?.records ?? [])
    .map((record) => normalizeRecord(record, query))
    .filter((candidate): candidate is NutritionCandidate => Boolean(candidate))
    .sort((a, b) => b.rawScore - a.rawScore);
}

function normalizeRecord(record: DataGovRecord, query: string): NutritionCandidate | null {
  if (!record.Code || !record.shmmitzrach) return null;

  const calories = toNumber(record.food_energy);
  const protein = toNumber(record.protein);
  const carbs = toNumber(record.carbohydrates);
  const fat = toNumber(record.total_fat);
  if (calories === null || protein === null || carbs === null || fat === null) return null;

  const { score, reasons } = scoreName(record.shmmitzrach, query);

  return {
    source: "israeli_nutrition_db",
    sourceId: String(record.Code),
    nameHe: record.shmmitzrach,
    nameEn: record.english_name ?? null,
    per100g: {
      calories,
      protein,
      carbs,
      fat
    },
    rawScore: score,
    confidenceReason: reasons
  };
}

function scoreName(name: string, query: string) {
  const normalizedName = normalizeHebrew(name);
  const normalizedQuery = normalizeHebrew(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  let score = 0;
  const reasons: string[] = [];

  if (normalizedName === normalizedQuery) {
    score += 100;
    reasons.push("exact_name");
  }

  if (normalizedName.includes(normalizedQuery)) {
    score += 45;
    reasons.push("phrase_match");
  }

  const matchedTokens = queryTokens.filter((token) => normalizedName.includes(token));
  score += matchedTokens.length * 12;
  if (matchedTokens.length === queryTokens.length && queryTokens.length > 0) {
    score += 20;
    reasons.push("all_tokens_match");
  }

  if (looksLikeRecipe(name) && queryTokens.length <= 2) {
    score -= 18;
    reasons.push("recipe_penalty");
  }

  return { score, reasons };
}

function normalizeHebrew(value: string) {
  return value
    .replace(/[״"׳']/g, "")
    .replace(/[.,;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function looksLikeRecipe(value: string) {
  return /עם|מטוגן|מבושל|ממולא|סלט|חמין|מרק/.test(value);
}

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
