import { searchNutrition, type NutritionCandidate } from "../nutrition/israeliNutrition.js";

type ParsedMealItem = {
  inputPhrase: string;
  selected?: NutritionCandidate;
  confidence: number;
  isEstimate: boolean;
  confidenceReason: string[];
  alternatives: NutritionCandidate[];
};

const FILLER_WORDS = [
  "אכלתי",
  "שתיתי",
  "וקצת",
  "קצת",
  "בערך",
  "מנה",
  "של"
];

export async function parseMealText(text: string) {
  const warnings: string[] = [];

  if (/אפרסק/.test(text)) {
    warnings.push("זוהתה מילה שקשורה לאלרגיה לאפרסק. לא לשמור בלי בדיקה ידנית.");
  }

  const phrases = extractFoodPhrases(text);
  const items: ParsedMealItem[] = [];

  for (const phrase of phrases) {
    const alternatives = await searchNutrition(phrase);
    const selected = alternatives[0];
    items.push({
      inputPhrase: phrase,
      selected,
      confidence: selected ? Math.min(0.95, selected.rawScore / 100) : 0,
      isEstimate: !selected || selected.rawScore < 80,
      confidenceReason: selected?.confidenceReason ?? ["no_match"],
      alternatives: alternatives.slice(1, 5)
    });
  }

  return {
    freeText: text,
    items,
    warnings
  };
}

function extractFoodPhrases(text: string) {
  return text
    .replace(/מ-\s*/g, "")
    .split(/\s+עם\s+|,|\/|\+|\s+ו(?=קצת\s|[א-ת]+(?:\s|$))/)
    .map(cleanPhrase)
    .map(applySimpleFoodAlias)
    .filter(Boolean);
}

function cleanPhrase(phrase: string) {
  const withoutFillers = FILLER_WORDS.reduce(
    (value, word) => value.replace(new RegExp(`(^|\\s)${word}(?=\\s|$)`, "g"), " "),
    phrase
  );

  return withoutFillers
    .replace(/[,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applySimpleFoodAlias(phrase: string) {
  if (/חביתה|ביצים|ביצה/.test(phrase)) return "ביצה";
  return phrase;
}
