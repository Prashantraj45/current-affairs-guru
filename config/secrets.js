/**
 * Secure Secret Management
 * Loads and validates all secrets from environment
 * Never logs or exposes secrets
 */
import { config } from 'dotenv';
config({ override: true });


class SecretManager {
  constructor() {
    this.secrets = {};
    this.loadedAt = new Date();
    this.validateSecrets();
  }

  /**
   * Load and validate all required secrets
   * @throws {Error} If critical secrets are missing
   */
  validateSecrets() {
    const requiredSecrets = [
      'MONGODB_URI',
      'ADMIN_SECRET'
    ];

    const optionalSecrets = [
      'PORT',
      'NODE_ENV',
      'SCHEDULER_ENABLED',
      'JOB_TIME',
      'CORS_ORIGIN',
      'LOG_LEVEL'
    ];

    // Load required secrets
    for (const secret of requiredSecrets) {
      const value = process.env[secret];

      if (!value) {
        throw new Error(
          `❌ Missing required secret: ${secret}\n` +
          `   Set in .env or environment variables\n` +
          `   See .env.example for template`
        );
      }

      if (secret === 'ANTHROPIC_API_KEY' && !value.startsWith('sk-ant-v7-')) {
        throw new Error(
          `❌ Invalid ANTHROPIC_API_KEY format\n` +
          `   Must start with: sk-ant-v7-`
        );
      }

      if (secret === 'MONGODB_URI' && !value.includes('mongodb')) {
        throw new Error(
          `❌ Invalid MONGODB_URI format\n` +
          `   Must contain: mongodb`
        );
      }

      if (secret === 'ADMIN_SECRET' && value.length < 32) {
        throw new Error(
          `❌ ADMIN_SECRET too short\n` +
          `   Minimum 32 characters required\n` +
          `   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
        );
      }

      this.secrets[secret] = value;
    }

    // Load optional secrets with defaults
    this.secrets.PORT = process.env.PORT || '3000';
    this.secrets.NODE_ENV = process.env.NODE_ENV || 'development';
    this.secrets.SCHEDULER_ENABLED = process.env.SCHEDULER_ENABLED !== 'false';
    this.secrets.JOB_TIME = process.env.JOB_TIME || '05:00';
    this.secrets.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3001';
    this.secrets.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

    console.log('✓ All secrets validated successfully');
  }

  /**
   * Get a secret by key
   * @param {string} key - Secret key
   * @param {any} defaultValue - Default if not found
   * @returns {any} Secret value
   */
  get(key, defaultValue = undefined) {
    if (!key) {
      throw new Error('Secret key cannot be empty');
    }

    const value = this.secrets[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Secret not found: ${key}`);
    }

    return value || defaultValue;
  }

  /**
   * Check if secret exists
   * @param {string} key - Secret key
   * @returns {boolean} True if exists
   */
  has(key) {
    return key in this.secrets;
  }
  /**
   * Get MongoDB URI (never expose in logs)
   * @returns {string} MongoDB connection string
   */
  getMongoUri() {
    const uri = this.get('MONGODB_URI');
    return {
      full: uri,
      masked: uri.replace(/:[^/]*@/, ':****@'),
      isValid: uri.includes('mongodb')
    };
  }

  /**
   * Get admin secret (never expose in logs or API)
   * @returns {string} Admin secret
   */
  getAdminSecret() {
    const secret = this.get('ADMIN_SECRET');
    return {
      full: secret,
      masked: '****REDACTED****',
      length: secret.length,
      isValid: secret.length >= 32
    };
  }

  /**
   * Safe log info (masked secrets)
   */
  logSafeInfo() {
    const mongoInfo = this.getMongoUri();

    console.log('\n═══════════════════════════════════════');
    console.log('🔐 System Configuration (Masked)');
    console.log('═══════════════════════════════════════');
    console.log(`Port:               ${this.get('PORT')}`);
    console.log(`Environment:        ${this.get('NODE_ENV')}`);
    console.log(`MongoDB:            ${mongoInfo.masked}`);
    console.log(`Admin Secret:       ${this.getAdminSecret().masked}`);
    console.log(`Scheduler:          ${this.get('SCHEDULER_ENABLED') ? 'Enabled' : 'Disabled'}`);
    console.log(`Job Time:           ${this.get('JOB_TIME')}`);
    console.log(`CORS Origin:        ${this.get('CORS_ORIGIN')}`);
    console.log('═══════════════════════════════════════\n');
  }

  /**
   * Prevent accidental secret exposure in JSON
   */
  toJSON() {
    return {
      ENV: 'SECRET_MANAGER',
      NOTICE: 'Secrets are never serialized to JSON',
      MASKED: true
    };
  }

  /**
   * Prevent accidental secret exposure in console
   */
  inspect() {
    return 'SecretManager { [REDACTED] }';
  }
}

// Create singleton instance
let instance = null;

export function initSecrets() {
  if (instance) return instance;
  instance = new SecretManager();
  return instance;
}

export function getSecret(key, defaultValue) {
  if (!instance) {
    instance = new SecretManager();
  }
  return instance.get(key, defaultValue);
}

export function secrets() {
  if (!instance) {
    instance = new SecretManager();
  }
  return instance;
}

// Initialize on import
export const secretManager = initSecrets();

export default secretManager;
