import type { SecurityResult } from '../package/security';

export type OsvQuery = {
  package: { ecosystem: 'npm'; name: string };
  version: string;
};

export type OsvReference = { type?: string; url: string };

export type OsvVuln = {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  published?: string;
  modified?: string;
  references?: OsvReference[];
  severity?: Array<{ type: string; score: string }>; // often CVSS strings
};

export type OsvResponse = {
  vulns?: OsvVuln[];
};

const OSV_ENDPOINT = 'https://api.osv.dev/v1/query';

export const fetchOsvForNpmVersion = async (
  name: string,
  version: string,
  signal?: AbortSignal
): Promise<OsvVuln[]> => {
  const body: OsvQuery = { package: { ecosystem: 'npm', name }, version };
  const res = await fetch(OSV_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    // You can map status codes if you want; for now surface unknown
    throw new Error(`OSV request failed: ${res.status}`);
  }

  const json = (await res.json()) as OsvResponse;

  return json.vulns ?? [];
};

export const securityFromOsvVulns = (vulns: OsvVuln[]): SecurityResult => {
  const count = vulns.length;

  if (count === 0) {
    return {
      key: 'ok',
      label: 'OK',
      title: 'No known vulnerabilities reported by OSV for this version',
      scorePct: 95,
      meta: { vulnCount: 0, vulns }
    };
  }

  const topIds = vulns.slice(0, 3).map((v) => v.id);

  if (count <= 2) {
    return {
      key: 'watch',
      label: 'Watch',
      title: `${count} known vulnerability${count === 1 ? '' : 'ies'} reported by OSV for this version`,
      scorePct: 65,
      meta: { vulnCount: count, topIds, vulns }
    };
  }

  return {
    key: 'risk',
    label: 'Risk',
    title: `${count} known vulnerabilities reported by OSV for this version`,
    scorePct: 35,
    meta: { vulnCount: count, topIds, vulns }
  };
};
