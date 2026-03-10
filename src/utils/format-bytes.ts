export type FormatBytesOptionsType = {
  /** base-2 (KiB/MiB) when true, base-10 (kB/MB) when false */
  binary?: boolean;
  /** decimals to keep (default 1, but 0 for bytes) */
  decimals?: number;
  /** return "-" for null/undefined/NaN */
  fallback?: string;
};

export const formatBytes = (
  bytes?: number | null,
  opts: FormatBytesOptionsType = {}
): {
  label: string;
  value: string;
  unit: string;
} => {
  const { binary = false, decimals = 1, fallback = '-' } = opts;

  if (bytes == null || !Number.isFinite(bytes))
    return {
      label: fallback,
      value: fallback,
      unit: fallback
    };

  const sign = bytes < 0 ? '-' : '';
  const b = Math.abs(bytes);

  if (b === 0)
    return {
      label: '0 B',
      value: '0',
      unit: 'B'
    };

  const base = binary ? 1024 : 1000;
  const units = binary
    ? ['b', 'kb', 'mb', 'gb', 'tb', 'pb']
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const exponent = Math.min(
    Math.floor(Math.log(b) / Math.log(base)),
    units.length - 1
  );
  const value = b / Math.pow(base, exponent);
  const d = exponent === 0 ? 0 : Math.max(0, decimals);

  return {
    label: `${sign}${value.toFixed(d)} ${units[exponent]}`,
    unit: units[exponent],
    value: value.toFixed(d)
  };
};
