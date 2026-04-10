// ─── Resolution Criteria Diff ─────────────────────────────────────────────────
// Pure string analysis — no LLM calls at runtime.

export interface ResolutionDiffResult {
  polymarketCriteria: string;
  kalshiCriteria: string;
  differencesFound: boolean;
  differenceType: "quantifier" | "scope" | "timeframe" | "entity" | "similar" | "unknown";
  keyDifferences: string[];
  similarityScore: number;
  warning: string | null;
}

const NOT_AVAILABLE_RESULT = (
  polymarketText: string | null,
  kalshiText: string | null
): ResolutionDiffResult => ({
  polymarketCriteria: polymarketText ?? "Not available",
  kalshiCriteria: kalshiText ?? "Not available",
  differencesFound: false,
  differenceType: "unknown",
  keyDifferences: [],
  similarityScore: 0,
  warning:
    "Resolution criteria not available for comparison. Verify manually on both platforms before trading.",
});

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

export function analyzeResolutionDiff(
  polymarketText: string | null,
  kalshiText: string | null
): ResolutionDiffResult {
  // If either text is missing, return the "not available" case
  if (!polymarketText || !kalshiText || polymarketText.trim() === "" || kalshiText.trim() === "") {
    return NOT_AVAILABLE_RESULT(polymarketText, kalshiText);
  }

  // Jaccard similarity
  const polyTokens = tokenize(polymarketText);
  const kalshiTokens = tokenize(kalshiText);
  const intersection = new Set([...polyTokens].filter((t) => kalshiTokens.has(t)));
  const union = new Set([...polyTokens, ...kalshiTokens]);
  const similarityScore = union.size === 0 ? 1 : intersection.size / union.size;

  const keyDifferences: string[] = [];
  let scopeTriggered = false;
  let timeframeTriggered = false;
  let entityTriggered = false;
  let quantifierTriggered = false;

  // QUANTIFIER CHECK
  const quantifierWords = [
    "any", "all", "at least", "exactly", "minimum", "maximum",
    "specific", "designated", "official",
  ];
  for (const word of quantifierWords) {
    const inPoly = polymarketText.toLowerCase().includes(word);
    const inKalshi = kalshiText.toLowerCase().includes(word);
    if (inPoly !== inKalshi) {
      keyDifferences.push(
        `One platform uses "${word}" which the other doesn't — scope differs materially.`
      );
      quantifierTriggered = true;
    }
  }

  // SCOPE CHECK — "any" vs "designated/specific"
  const polyHasAny = /\bany\b/i.test(polymarketText);
  const kalshiHasAny = /\bany\b/i.test(kalshiText);
  const polyHasSpecific = /\b(designated|specific|officially)\b/i.test(polymarketText);
  const kalshiHasSpecific = /\b(designated|specific|officially)\b/i.test(kalshiText);

  if ((polyHasAny && kalshiHasSpecific) || (kalshiHasAny && polyHasSpecific)) {
    keyDifferences.push(
      "Polymarket says 'any', Kalshi requires 'designated/specific' — these resolve to different events."
    );
    scopeTriggered = true;
  } else if (polyHasAny !== kalshiHasAny || polyHasSpecific !== kalshiHasSpecific) {
    scopeTriggered = true;
  }

  // TIMEFRAME CHECK
  const datePattern =
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}|\bQ[1-4]\s+\d{4}|\bby\s+(end|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov)|before\s+\w+|within\s+\d+\s+days?)\b/gi;
  const polyDates = polymarketText.match(datePattern) || [];
  const kalshiDates = kalshiText.match(datePattern) || [];
  if (polyDates.length !== kalshiDates.length || polyDates.join(",").toLowerCase() !== kalshiDates.join(",").toLowerCase()) {
    if (polyDates.length > 0 || kalshiDates.length > 0) {
      keyDifferences.push("Resolution timeframes differ between platforms.");
      timeframeTriggered = true;
    }
  }

  // ENTITY CHECK — capitalized multi-word phrases in one but not the other
  const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const polyNouns = new Set((polymarketText.match(properNounPattern) || []).map((n) => n.toLowerCase()));
  const kalshiNouns = new Set((kalshiText.match(properNounPattern) || []).map((n) => n.toLowerCase()));
  const polyOnlyNouns = [...polyNouns].filter((n) => !kalshiNouns.has(n));
  const kalshiOnlyNouns = [...kalshiNouns].filter((n) => !polyNouns.has(n));
  if (polyOnlyNouns.length > 0 || kalshiOnlyNouns.length > 0) {
    entityTriggered = true;
    if (polyOnlyNouns.length > 0 || kalshiOnlyNouns.length > 0) {
      keyDifferences.push(
        `Entity mismatch: some named entities appear only on one platform (${[...polyOnlyNouns, ...kalshiOnlyNouns].slice(0, 3).join(", ")}).`
      );
    }
  }

  // Determine differenceType
  let differenceType: ResolutionDiffResult["differenceType"];
  if (scopeTriggered || quantifierTriggered) {
    differenceType = scopeTriggered ? "scope" : "quantifier";
  } else if (timeframeTriggered) {
    differenceType = "timeframe";
  } else if (entityTriggered) {
    differenceType = "entity";
  } else if (similarityScore >= 0.7) {
    differenceType = "similar";
  } else {
    differenceType = "quantifier";
  }

  const differencesFound = keyDifferences.length > 0 || similarityScore < 0.5;

  // Warning logic
  let warning: string | null = null;
  if (differenceType === "scope") {
    warning =
      "⚠ Critical: Platforms may resolve to different events despite appearing identical. Verify carefully before treating as arbitrage.";
  } else if (differenceType === "timeframe") {
    warning = "⚠ Resolution windows differ — timing risk on this spread.";
  } else if (differencesFound && similarityScore < 0.5) {
    warning = "⚠ Significant wording differences detected. Verify on both platforms.";
  } else if (differencesFound && similarityScore >= 0.7) {
    warning = "Minor wording differences — likely same event but verify edge cases.";
  }

  return {
    polymarketCriteria: polymarketText,
    kalshiCriteria: kalshiText,
    differencesFound,
    differenceType,
    keyDifferences,
    similarityScore,
    warning,
  };
}
