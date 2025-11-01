/**
 * Data Encryption Utilities
 * Helper functions for encrypting and decrypting sensitive data
 *
 * NOTE: This is a basic implementation. In production, consider using:
 * - AWS KMS, Google Cloud KMS, or Azure Key Vault for key management
 * - Envelope encryption for better security
 * - Key rotation policies
 */

import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // Initialization Vector length
const AUTH_TAG_LENGTH = 16; // Authentication tag length
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment or generate one
 * WARNING: In production, use a secure key management service
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;

  if (!keyString) {
    console.warn(
      "WARNING: ENCRYPTION_KEY not set in environment. Using a temporary key. " +
        "This is NOT secure for production use. Generate a key with: " +
        "openssl rand -base64 32",
    );
    // This is only for development - never use a hardcoded key in production
    return Buffer.from(
      "temporary-development-key-change-me-in-production",
      "utf8",
    ).subarray(0, KEY_LENGTH);
  }

  // Derive a consistent key from the environment variable
  const salt = Buffer.from("school-management-salt"); // In production, use a random salt per installation
  return crypto.pbkdf2Sync(keyString, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypt a string value
 * Returns a base64-encoded string with IV and auth tag
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, "base64"),
    ]);

    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt an encrypted string
 * Expects a base64-encoded string with IV and auth tag
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, "base64");

    // Extract IV, auth tag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(
      encrypted.toString("base64"),
      "base64",
      "utf8",
    );
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash a value (one-way)
 * Useful for comparing sensitive values without storing them in plain text
 */
export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("base64");
}

/**
 * Generate a secure random token
 * Useful for verification codes, reset tokens, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, length);
}

/**
 * Check if a value is encrypted (basic check)
 */
export function isEncrypted(value: string): boolean {
  try {
    // Check if it's base64 and has the right length
    const buffer = Buffer.from(value, "base64");
    return buffer.length > IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Encrypt an object's sensitive fields
 * Useful for encrypting multiple fields at once
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (typeof value === "string" && value.length > 0) {
      result[field] = encrypt(value) as T[keyof T];
    }
  }

  return result;
}

/**
 * Decrypt an object's encrypted fields
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (typeof value === "string" && value.length > 0 && isEncrypted(value)) {
      try {
        result[field] = decrypt(value) as T[keyof T];
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }

  return result;
}

/**
 * Example usage for sensitive student data
 */
export interface SensitiveStudentData extends Record<string, unknown> {
  medicalInfo?: string;
  emergencyContact?: string;
  address?: string;
}

export function encryptSensitiveStudentData(
  data: SensitiveStudentData,
): SensitiveStudentData {
  const sensitiveFields: (keyof SensitiveStudentData)[] = [
    "medicalInfo",
    "emergencyContact",
    "address",
  ];

  return encryptFields(data, sensitiveFields);
}

export function decryptSensitiveStudentData(
  data: SensitiveStudentData,
): SensitiveStudentData {
  const sensitiveFields: (keyof SensitiveStudentData)[] = [
    "medicalInfo",
    "emergencyContact",
    "address",
  ];

  return decryptFields(data, sensitiveFields);
}

/**
 * Generate encryption key (for setup)
 * Run this once and store the result in your environment variables
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
