import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiKey } from './api-key.entity';
import * as crypto from 'crypto';

/**
 * Separate entity to store encrypted client_secret for HMAC verification
 * This allows us to verify HMAC signatures without storing plaintext secrets
 * The secret is encrypted using AES-256-GCM
 */
@Entity('api_key_secrets')
@Index(['apiKeyId'], { unique: true })
export class ApiKeySecret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_key_id', unique: true })
  apiKeyId: string;

  @OneToOne(() => ApiKey)
  @JoinColumn({ name: 'api_key_id' })
  apiKey: ApiKey;

  @Column({ name: 'encrypted_secret', type: 'text' })
  encryptedSecret: string; // AES-256-GCM encrypted client_secret

  @Column({ name: 'iv', type: 'text' })
  iv: string; // Initialization vector for AES encryption

  @CreateDateColumn()
  createdAt: Date;

  // Helper method to encrypt secret
  // encryptionKey should be 32 bytes (64 hex chars) for AES-256
  static encryptSecret(secret: string, encryptionKey: string): { encrypted: string; iv: string } {
    // Ensure encryption key is 32 bytes
    const key = encryptionKey.length === 64 
      ? Buffer.from(encryptionKey, 'hex')
      : crypto.createHash('sha256').update(encryptionKey).digest();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: `${encrypted}:${authTag.toString('hex')}`,
      iv: iv.toString('hex'),
    };
  }

  // Helper method to decrypt secret
  static decryptSecret(encryptedData: string, iv: string, encryptionKey: string): string {
    // Ensure encryption key is 32 bytes
    const key = encryptionKey.length === 64 
      ? Buffer.from(encryptionKey, 'hex')
      : crypto.createHash('sha256').update(encryptionKey).digest();
    
    const [encrypted, authTagHex] = encryptedData.split(':');
    if (!encrypted || !authTagHex) {
      throw new Error('Invalid encrypted data format');
    }
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex'),
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

