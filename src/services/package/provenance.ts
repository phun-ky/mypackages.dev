/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NpmDist } from '../../types';
import { clamp } from '../../utils/clamp';

export type ProvenanceKey =
  | 'verified'
  | 'present'
  | 'missing'
  | 'unknown'
  | 'invalid';

export type ProvenanceLabel =
  | 'Verified'
  | 'Present'
  | 'Missing'
  | 'Unknown'
  | 'Invalid';

export type ProvenanceReason =
  | 'no-dist'
  | 'no-integrity'
  | 'signatures-present'
  | 'no-signatures'
  | 'attestations-present'
  | 'no-attestations'
  | 'slsa-provenance'
  | 'non-slsa-attestation';

export type ProvenanceResult = {
  key: ProvenanceKey;
  label: ProvenanceLabel;
  title: string;
  scorePct: number; // 0..100 higher is better
  reasons: ProvenanceReason[];
  meta?: {
    hasIntegrity?: boolean;
    signaturesCount?: number;
    attestationUrl?: string;
    predicateType?: string;
  };
};

/**
 * Browser-friendly provenance score based on *presence* (not cryptographic verification yet).
 * You can later upgrade this to "verified" once you implement signature/attestation verification.
 */
export const packageProvenance = (dist?: NpmDist | null): ProvenanceResult => {
  if (!dist) {
    return {
      key: 'unknown',
      label: 'Unknown',
      title: 'Distribution metadata unavailable',
      scorePct: 50,
      reasons: ['no-dist']
    };
  }

  const hasIntegrity = Boolean(dist.integrity);
  const signatures = Array.isArray((dist as any).signatures)
    ? ((dist as any).signatures as any[])
    : [];
  const sigCount = signatures.length;
  const attestations = (dist as any).attestations as
    | { url?: string; provenance?: { predicateType?: string } }
    | undefined;
  const attestationUrl = attestations?.url;
  const predicateType = attestations?.provenance?.predicateType;
  const hasAttestations = Boolean(attestationUrl);
  const reasons: ProvenanceReason[] = [];

  if (!hasIntegrity) reasons.push('no-integrity');

  if (sigCount > 0) reasons.push('signatures-present');
  else reasons.push('no-signatures');

  if (hasAttestations) reasons.push('attestations-present');
  else reasons.push('no-attestations');

  if (predicateType) {
    if (predicateType.includes('slsa.dev/provenance'))
      reasons.push('slsa-provenance');
    else reasons.push('non-slsa-attestation');
  }

  // Scoring (presence-based)
  let score = 0;

  // Integrity is a baseline "artifact identity"
  score += hasIntegrity ? 20 : 0;

  // Signatures: strong signal
  score += sigCount > 0 ? 40 : 0;

  // Attestations: strong signal
  score += hasAttestations ? 35 : 0;

  // SLSA provenance gets a small boost
  score += predicateType?.includes('slsa.dev/provenance') ? 5 : 0;

  score = clamp(score, 0, 100);

  // Key mapping (presence-based)
  // NOTE: "verified" is reserved for future cryptographic verification.
  let key: ProvenanceKey = 'unknown';
  let label: ProvenanceLabel = 'Unknown';
  let title = 'Provenance data incomplete';

  if (sigCount === 0 && !hasAttestations) {
    key = 'missing';
    label = 'Missing';
    title = 'No signatures or attestations found';
    score = Math.min(score, 35);
  } else if (sigCount > 0 || hasAttestations) {
    key = 'present';
    label = 'Present';
    title =
      sigCount > 0 && hasAttestations
        ? 'Signatures and attestations present (not verified)'
        : sigCount > 0
          ? 'Signatures present (not verified)'
          : 'Attestations present (not verified)';
  }

  return {
    key,
    label,
    title,
    scorePct: score,
    reasons,
    meta: {
      hasIntegrity,
      signaturesCount: sigCount,
      attestationUrl: attestationUrl,
      predicateType
    }
  };
};
