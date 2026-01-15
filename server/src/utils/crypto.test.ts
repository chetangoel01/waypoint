import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, isEncrypted } from './crypto.js';
import config from '../config/index.js';

describe('Crypto Utils', () => {
  beforeAll(() => {
    // Set a dummy key for testing
    config.encryptionKey = 'test-key-must-be-very-long-to-be-secure';
  });

  it('should encrypt and decrypt a string correctly', () => {
    const original = 'secret-api-key-123';
    const encrypted = encrypt(original);
    
    expect(encrypted).not.toBe(original);
    expect(isEncrypted(encrypted)).toBe(true);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should handle different plaintexts producing different ciphertexts', () => {
    const text1 = 'secret1';
    const text2 = 'secret2';
    
    const enc1 = encrypt(text1);
    const enc2 = encrypt(text2);
    
    expect(enc1).not.toBe(enc2);
  });

  it('should be deterministic for the same key/IV? No, GCM uses random IVs', () => {
    const text = 'same-text';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    
    // They should be different because of random IVs
    expect(enc1).not.toBe(enc2);
    
    // But both should decrypt to the same value
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  it('should handle "plain:" prefixed values', () => {
    const plain = 'plain:unencrypted-value';
    expect(decrypt(plain)).toBe('unencrypted-value');
  });
});
