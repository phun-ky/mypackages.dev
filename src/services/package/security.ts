import {
  fetchOsvForNpmVersion,
  securityFromOsvVulns,
  type OsvVuln
} from '../osv/vulnerabilities';

export type SecurityKey = 'ok' | 'watch' | 'risk' | 'unknown';

export type SecurityResult = {
  key: SecurityKey;
  label: 'OK' | 'Watch' | 'Risk' | 'Unknown';
  title: string;
  scorePct: number; // 0..100, higher is better
  meta?: {
    vulns: OsvVuln[];
    vulnCount?: number;
    topIds?: string[];
  };
};

export const packageSecurity = async (
  name: string,
  version?: string,
  signal?: AbortSignal
): Promise<SecurityResult> => {
  if (!version)
    return {
      key: 'unknown',
      label: 'Unknown',
      title: 'Security data unavailable',
      scorePct: 50,
      meta: {
        vulns: []
      }
    };

  try {
    const vulns = await fetchOsvForNpmVersion(name, version, signal);

    return securityFromOsvVulns(vulns);
  } catch {
    return {
      key: 'unknown',
      label: 'Unknown',
      title: 'Security data unavailable',
      scorePct: 50,
      meta: {
        vulns: []
      }
    };
  }
};
