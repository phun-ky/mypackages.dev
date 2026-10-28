import { supabase } from '../../services/supabase';

export type LookupKind = 'package' | 'user';

export type Lookups = {
  trending: string[];
  popular: { term: string; people: number }[];
  latest: { term: string; at: number }[];
};

const rows = async <T>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> => {
  try {
    const { data, error } = await query;

    return error ? [] : (data ?? []);
  } catch {
    return [];
  }
};

/**
 * What people looked up of one kind (see log_search_event): trending in the
 * last 24 hours, the most looked up by unique people, and the latest. A view
 * that can't be read counts as empty.
 */
export const getLookups = async (kind: LookupKind): Promise<Lookups> => {
  const [trending, popular, latest] = await Promise.all([
    rows<{ term: string }>(
      supabase
        .from('trending_lookups_24h')
        .select('term')
        .eq('kind', kind)
        .limit(8)
    ),
    rows<{ term: string; unique_people: number }>(
      supabase
        .from('popular_lookups_unique_people')
        .select('term, unique_people')
        .eq('kind', kind)
        .limit(6)
    ),
    rows<{ term: string; created_at: string }>(
      supabase
        .from('latest_unique_lookups')
        .select('term, created_at')
        .eq('kind', kind)
        .limit(12)
    )
  ]);

  return {
    trending: trending.map((row) => row.term),
    popular: popular.map((row) => ({
      term: row.term,
      people: row.unique_people
    })),
    latest: latest.map((row) => ({
      term: row.term,
      at: Date.parse(row.created_at)
    }))
  };
};
