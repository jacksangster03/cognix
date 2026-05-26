export interface SupplementTemplate {
  name: string
  category: string
  evidence_level: "strong" | "moderate" | "limited" | "anecdotal"
  timing: string
  half_life_hours: number | null
  notes: string
}

export const DEFAULT_SUPPLEMENTS: SupplementTemplate[] = [
  {
    name: "Creatine Monohydrate",
    category: "performance",
    evidence_level: "strong",
    timing: "Any time (consistency is what matters)",
    half_life_hours: null,
    notes: "5g daily. Loading phase optional. Most evidence-supported supplement in existence.",
  },
  {
    name: "Vitamin D3",
    category: "micronutrient",
    evidence_level: "strong",
    timing: "With largest meal (fat-soluble)",
    half_life_hours: null,
    notes: "2000-4000 IU daily, especially in northern latitudes or low sun exposure.",
  },
  {
    name: "Omega-3 (EPA/DHA)",
    category: "recovery",
    evidence_level: "strong",
    timing: "With meals",
    half_life_hours: null,
    notes: "2-3g EPA+DHA daily. Anti-inflammatory, supports cardiovascular and brain health.",
  },
  {
    name: "Magnesium Glycinate",
    category: "recovery",
    evidence_level: "moderate",
    timing: "30-60 min before bed",
    half_life_hours: 2.5,
    notes: "200-400mg elemental magnesium. Supports sleep quality and muscle relaxation.",
  },
  {
    name: "Zinc",
    category: "micronutrient",
    evidence_level: "moderate",
    timing: "Away from calcium sources",
    half_life_hours: 1.5,
    notes: "15-30mg. Testosterone support, immune function. Do not take with calcium (competes for absorption).",
  },
  {
    name: "Caffeine",
    category: "cognitive",
    evidence_level: "strong",
    timing: "Before 14:00 (half-life 5.5h)",
    half_life_hours: 5.5,
    notes: "3-6mg/kg bodyweight. Most studied ergogenic. Stop before personal cutoff time.",
  },
  {
    name: "Ashwagandha",
    category: "recovery",
    evidence_level: "moderate",
    timing: "Morning or evening",
    half_life_hours: 2.5,
    notes: "300-600mg KSM-66. May modulate cortisol and support stress resilience.",
  },
  {
    name: "L-Citrulline",
    category: "performance",
    evidence_level: "moderate",
    timing: "30-60 min pre-workout",
    half_life_hours: 1.0,
    notes: "6-8g. Improves blood flow and reduces exercise-induced fatigue.",
  },
  {
    name: "Beta-Alanine",
    category: "performance",
    evidence_level: "moderate",
    timing: "Pre-workout (timing flexible)",
    half_life_hours: 2.0,
    notes: "3.2-6.4g daily. Buffers muscle acid. Tingling (paraesthesia) is normal.",
  },
  {
    name: "Melatonin",
    category: "recovery",
    evidence_level: "strong",
    timing: "21:00-22:00 (not before or after)",
    half_life_hours: 0.75,
    notes: "0.5-1mg. Use for sleep onset issues or circadian shifts, not nightly. Avoid high doses.",
  },
]

export const DEFAULT_SUPPLEMENT_NAMES = DEFAULT_SUPPLEMENTS.map((s) => s.name)
