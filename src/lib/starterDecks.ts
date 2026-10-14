/**
 * KeyCaster Starter Vocabulary Packs & Custom Deck Serialization Utilities
 *
 * Provides curated decks for GRE, Dev Syntax, Typing Demons, and Medical nomenclature,
 * plus bidirectional JSON and TXT deck export / import parsing.
 */

export interface StarterDeck {
  id: string;
  name: string;
  description: string;
  badge: string;
  words: string[];
}

export const STARTER_DECKS: StarterDeck[] = [
  {
    id: "gre_sat",
    name: "GRE & SAT High Frequency",
    description: "Crucial collegiate and graduate-level vocabulary for advanced spelling precision.",
    badge: "Vocabulary",
    words: [
      "ephemeral",
      "ubiquitous",
      "obfuscate",
      "serendipity",
      "surreptitious",
      "perfunctory",
      "quintessential",
      "anachronistic",
      "loquacious",
      "esoteric",
      "magnanimous",
      "fastidious",
      "sycophant",
      "perspicacious",
      "cacophony",
      "ineffable",
      "recalcitrant",
      "equanimity",
      "mellifluous",
      "verisimilitude",
    ],
  },
  {
    id: "dev_syntax",
    name: "Programming & Dev Syntax",
    description: "High-frequency engineering terms, architecture concepts, and runtime keywords.",
    badge: "Engineering",
    words: [
      "asynchronous",
      "polymorphism",
      "immutable",
      "middleware",
      "concurrency",
      "encapsulation",
      "idempotent",
      "instantiation",
      "deprecate",
      "serialization",
      "microservices",
      "callback",
      "kubernetes",
      "telemetry",
      "distributed",
      "deterministic",
      "scalability",
      "cryptography",
      "containerization",
      "orchestration",
    ],
  },
  {
    id: "typing_demons",
    name: "Common Typing Demons",
    description: "Notorious orthographic stumbling blocks that trip up even veteran touch typists.",
    badge: "Speed Demons",
    words: [
      "rhythm",
      "accommodate",
      "liaison",
      "bureaucracy",
      "maneuver",
      "definitely",
      "conscientious",
      "privilege",
      "embarrass",
      "occurrence",
      "supersede",
      "millennium",
      "questionnaire",
      "pronunciation",
      "hierarchy",
      "maintenance",
      "perseverance",
      "reconnaissance",
      "indispensable",
      "misspell",
    ],
  },
  {
    id: "medical_anatomy",
    name: "Medical & Anatomical",
    description: "Complex clinical roots and anatomical nomenclature demanding high rhythm stamina.",
    badge: "Medical",
    words: [
      "cerebrovascular",
      "gastrointestinal",
      "myocardial",
      "hypoglycemia",
      "pharmacokinetics",
      "encephalopathy",
      "arrhythmia",
      "hemoglobin",
      "homeostasis",
      "neurotransmitter",
      "bronchospasm",
      "atherosclerosis",
      "hypertrophy",
      "thrombocytopenia",
      "lymphadenopathy",
    ],
  },
];

export interface ExportedDeckPayload {
  format: "keycaster_deck_v1";
  name: string;
  description?: string;
  words: string[];
  exportedAt: string;
}

export function exportDeckToJson(name: string, words: string[], description?: string): string {
  const payload: ExportedDeckPayload = {
    format: "keycaster_deck_v1",
    name,
    description: description || `Custom deck exported from KeyCaster`,
    words,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

export function exportDeckToTxt(words: string[]): string {
  return words.join("\n");
}

export function parseImportedDeck(rawContent: string): { name?: string; words: string[] } {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    throw new Error("File is empty.");
  }

  // Try parsing JSON format
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.words)) {
        const words = parsed.words
          .filter((w: unknown): w is string => typeof w === "string")
          .map((w: string) => w.trim().toLowerCase().replace(/\s+/g, " "))
          .filter((w: string) => /^[a-z]+([ -][a-z]+)*$/i.test(w));

        return {
          name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : undefined,
          words: Array.from(new Set(words)),
        };
      }
    } catch {
      // Fall through to line/comma parsing
    }
  }

  // Plain text / CSV parsing
  const words = trimmed
    .split(/[\r\n,]+/)
    .map((w) => w.trim().toLowerCase().replace(/\s+/g, " "))
    .filter((w) => /^[a-z]+([ -][a-z]+)*$/i.test(w));

  return { words: Array.from(new Set(words)) };
}

export function downloadTextFile(filename: string, content: string, mimeType = "application/json"): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
