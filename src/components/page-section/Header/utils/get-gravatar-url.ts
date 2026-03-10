import { sha256 } from '../../../../utils/sha-256';

export const getGravatarUrl = async (email?: string) => {
  if (!email) return '';

  const hashedEmail = await sha256(email);

  const gravatarUrl = `https://www.gravatar.com/avatar/${hashedEmail}`;
  return gravatarUrl;
};
