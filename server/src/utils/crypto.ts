import crypto from 'crypto';
import config from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment, deriving a 32-byte key if needed.
 * If no key is set, returns null (encryption disabled).
 */
function getEncryptionKey(): Buffer | null {
  const keySource = config.encryptionKey;
  if (!keySource) {
    return null;
  }
  // Derive a 32-byte key using SHA-256
  return crypto.createHash('sha256').update(keySource).digest();
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns the encrypted data as a base64 string with IV and auth tag prepended.
 * If encryption is disabled (no key), returns the plaintext prefixed with 'plain:'.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  
  if (!key) {
    // No encryption key configured - store with 'plain:' prefix so we know it's unencrypted
    return `plain:${plaintext}`;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + auth tag + encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted]);
  
  return `enc:${combined.toString('base64')}`;
}

/**
 * Decrypt a string that was encrypted with encrypt().
 * Handles both encrypted ('enc:' prefix) and plaintext ('plain:' prefix) values.
 */
export function decrypt(encryptedData: string): string {
  // Handle plaintext values (stored when encryption was disabled)
  if (encryptedData.startsWith('plain:')) {
    return encryptedData.slice(6);
  }
  
  // Handle legacy unencrypted values (no prefix)
  if (!encryptedData.startsWith('enc:')) {
    return encryptedData;
  }

  const key = getEncryptionKey();
  
  if (!key) {
    throw new Error('Cannot decrypt: ENCRYPTION_KEY not configured');
  }

  const combined = Buffer.from(encryptedData.slice(4), 'base64');
  
  // Extract IV, auth tag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * Check if a value is encrypted (has 'enc:' prefix).
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith('enc:');
}

/**
 * Check if encryption is enabled (ENCRYPTION_KEY is set).
 */
export function isEncryptionEnabled(): boolean {
  return !!config.encryptionKey;
}
