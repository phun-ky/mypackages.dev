import { clamp } from '../../utils/clamp';

export type HealthMetric = {
  scorePct?: number; // 0..100
  key?: string; // optional ("deprecated", "risk", etc.)
};

export type Health = {
  scorePct: number;
  label: 'Excellent' | 'Good' | 'OK' | 'Poor' | 'Unknown';
  confidencePct: number; // how much data we had
  meta: {
    weighted: {
      maintenance?: number;
      popularity?: number;
      quality?: number;
      security?: number;
      provenance?: number;
    };
    weightsUsed: Record<string, number>;
  };
};

export const packageHealth = (args: {
  maintenance?: HealthMetric;
  popularity?: HealthMetric;
  quality?: HealthMetric;
  security?: HealthMetric;
  provenance?: HealthMetric;
}): Health => {
  const weights = {
    security: 0.3,
    provenance: 0.1,
    maintenance: 0.25,
    quality: 0.25,
    popularity: 0.1
  } as const;
  // Collect present metrics
  const parts: Array<{
    name: keyof typeof weights;
    score: number;
    weight: number;
  }> = [];

  (Object.keys(weights) as Array<keyof typeof weights>).forEach((name) => {
    const metric = args[name];

    if (
      metric &&
      typeof metric.scorePct === 'number' &&
      Number.isFinite(metric.scorePct)
    ) {
      parts.push({
        name,
        score: clamp(metric.scorePct, 0, 100),
        weight: weights[name]
      });
    }
  });

  if (parts.length === 0) {
    return {
      scorePct: 50,
      label: 'Unknown',
      confidencePct: 0,
      meta: { weighted: {}, weightsUsed: {} }
    };
  }

  // Re-normalize weights for missing metrics
  const weightSum = parts.reduce((s, p) => s + p.weight, 0);
  const normalized = parts.map((p) => ({ ...p, weight: p.weight / weightSum }));

  // Base weighted average
  let score = normalized.reduce((s, p) => s + p.score * p.weight, 0);

  // Guardrail 1: Deprecated should never be "healthy"
  const isDeprecated = args.maintenance?.key === 'deprecated';

  if (isDeprecated) {
    score = Math.min(score, 15);
  }

  // Guardrail 2: Security drag - if security is low, overall cannot be high
  if (
    args.security &&
    typeof args.security.scorePct === 'number' &&
    args.provenance &&
    typeof args.provenance.scorePct === 'number'
  ) {
    const s = args.security.scorePct;

    if (s < 40)
      score = Math.min(score, 55); // “Risk” caps overall
    else if (s < 60) score = Math.min(score, 75); // “Watch” caps overall
  }

  // Guardrail 3: Provenance cannot "save" a risky package
  // (e.g. signed/attested but has critical vulns)
  if (
    args.security &&
    typeof args.security.scorePct === 'number' &&
    args.provenance &&
    typeof args.provenance.scorePct === 'number'
  ) {
    const sec = args.security.scorePct;

    if (sec < 40) {
      // if it's risky, provenance can help a little but not a lot
      score = Math.min(score, 60);
    }
  }

  score = clamp(Math.round(score), 0, 100);

  const label =
    score >= 85
      ? 'Excellent'
      : score >= 70
        ? 'Good'
        : score >= 50
          ? 'OK'
          : 'Poor';
  // Confidence: how many metrics we had, weighted by importance
  const confidencePct = Math.round(weightSum * 100);
  const weighted: Record<string, number> = {};
  const weightsUsed: Record<string, number> = {};

  normalized.forEach((p) => {
    weighted[p.name] = Math.round(p.score * p.weight * 10) / 10;
    weightsUsed[p.name] = Math.round(p.weight * 1000) / 1000;
  });

  return {
    scorePct: score,
    label,
    confidencePct,
    meta: { weighted, weightsUsed }
  };
};
