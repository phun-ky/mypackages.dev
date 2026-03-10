export const getAnonId = () => {
  const key = 'anon_id';

  let v = localStorage.getItem(key);

  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }

  return v;
};
