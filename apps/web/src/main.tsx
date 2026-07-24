import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, Plus, Scale, Utensils } from "lucide-react";
import "./styles.css";

type ParsedItem = {
  inputPhrase: string;
  selected?: {
    nameHe: string;
    source: string;
    sourceId: string;
    per100g: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  confidence: number;
  isEstimate: boolean;
  confidenceReason: string[];
  alternatives: Array<{
    nameHe: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
};

type ParseResponse = {
  freeText: string;
  items: ParsedItem[];
  warnings: string[];
};

function App() {
  const [mealText, setMealText] = useState("פיתה עם חביתה מ-2 ביצים וקצת גבינה לבנה");
  const [draft, setDraft] = useState<ParseResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    if (!draft) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return draft.items.reduce(
      (sum, item) => {
        if (!item.selected) return sum;
        sum.calories += item.selected.per100g.calories;
        sum.protein += item.selected.per100g.protein;
        sum.carbs += item.selected.per100g.carbs;
        sum.fat += item.selected.per100g.fat;
        return sum;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [draft]);

  async function parseMeal() {
    setLoading(true);
    try {
      const response = await fetch("/api/meals/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: mealText })
      });
      setDraft(await response.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="summary">
        <div>
          <p className="eyebrow">היום</p>
          <h1>Fit Plan</h1>
        </div>
        <div className="metric-grid">
          <Metric icon={<Utensils size={20} />} label="נאכל" value={`${Math.round(totals.calories)} קל׳`} />
          <Metric icon={<Activity size={20} />} label="חלבון" value={`${totals.protein.toFixed(1)} ג׳`} />
          <Metric icon={<Scale size={20} />} label="משקל יעד" value="100 ק״ג" />
        </div>
      </section>

      <section className="panel">
        <label htmlFor="meal">מה אכלת?</label>
        <textarea id="meal" value={mealText} onChange={(event) => setMealText(event.target.value)} rows={4} />
        <button type="button" onClick={parseMeal} disabled={loading || !mealText.trim()}>
          <Plus size={18} />
          {loading ? "מפרק..." : "פרק ארוחה"}
        </button>
      </section>

      {draft && (
        <section className="panel">
          <div className="section-head">
            <h2>טיוטת פירוק</h2>
            <span>{draft.items.length} פריטים</span>
          </div>
          {draft.warnings.map((warning) => (
            <p className="warning" key={warning}>{warning}</p>
          ))}
          <div className="items">
            {draft.items.map((item) => (
              <article className="food-item" key={item.inputPhrase}>
                <div>
                  <h3>{item.inputPhrase}</h3>
                  <p>{item.selected?.nameHe ?? "לא נמצאה התאמה"}</p>
                </div>
                {item.selected && (
                  <dl>
                    <div><dt>קל׳</dt><dd>{item.selected.per100g.calories}</dd></div>
                    <div><dt>חלבון</dt><dd>{item.selected.per100g.protein}</dd></div>
                    <div><dt>פחמ׳</dt><dd>{item.selected.per100g.carbs}</dd></div>
                    <div><dt>שומן</dt><dd>{item.selected.per100g.fat}</dd></div>
                  </dl>
                )}
                <span className={item.isEstimate ? "pill estimate" : "pill"}>{item.isEstimate ? "הערכה" : "התאמה"}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
