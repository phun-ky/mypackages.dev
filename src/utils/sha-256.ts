export const sha256 = async (message: string): Promise<string> => {
  if (!message || message === '') return message;

  // Encode the message as a Uint8Array (utf-8 is standard)
  const msgUint8 = new TextEncoder().encode(message);
  // Hash the message
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  // Convert the ArrayBuffer to a hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
};
