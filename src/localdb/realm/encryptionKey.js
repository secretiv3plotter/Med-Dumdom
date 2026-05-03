// Realm requires a stable 64-byte key for encrypted local files.
// For production, store this key in the device keystore/secure storage instead of source control.
export const realmEncryptionKey = new Uint8Array([
  77, 101, 100, 68, 117, 109, 100, 111,
  109, 76, 111, 99, 97, 108, 68, 66,
  80, 97, 116, 105, 101, 110, 116, 77,
  101, 100, 84, 114, 97, 99, 107, 49,
  83, 101, 110, 115, 105, 116, 105, 118,
  101, 77, 101, 100, 105, 99, 105, 110,
  101, 68, 97, 116, 97, 75, 101, 121,
  50, 48, 50, 54, 48, 53, 48, 51,
]);
