export const scoreRecency = (ageDays: number) => {
  if (ageDays <= 14) return 100;

  if (ageDays <= 60) return 90;

  if (ageDays <= 180) return 60;

  if (ageDays <= 365) return 35;

  return 15;
};
