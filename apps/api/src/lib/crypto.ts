import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for encryption
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment or generate one
 * In production, store this in a secure secrets manager
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    console.warn(
      'WARNING: ENCRYPTION_KEY not set. Using temporary key. This is insecure for production.'
    );
    // Generate a temporary key (not recommended for production)
    return randomBytes(KEY_LENGTH);
  }

  // Convert hex string to buffer
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string value
 * Returns base64-encoded encrypted data with IV and auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

  return combined.toString('base64');
}

/**
 * Decrypt an encrypted string
 * Expects base64-encoded data with IV and auth tag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract iv, authTag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a secure random encryption key
 * Use this to generate your ENCRYPTION_KEY environment variable
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('hex');
}

// Example usage in development
if (process.env.NODE_ENV === 'development' && !process.env.ENCRYPTION_KEY) {
  console.log('\nGenerate an encryption key for production:');
  console.log('ENCRYPTION_KEY=' + generateEncryptionKey());
  console.log('');
}
