import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import type { Express } from 'express-serve-static-core';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private publicUrl?: string;
  /**
   * Object ACL to request, or undefined to send none.
   *
   * Buckets created after April 2023 default to Object Ownership =
   * BucketOwnerEnforced, where ACLs are *disabled* and any PutObject carrying
   * one fails outright with AccessControlListNotSupported. Sending no ACL is
   * therefore the correct default; such buckets are made public with a bucket
   * policy or fronted by CloudFront. Set AWS_S3_ACL=public-read for an older
   * bucket that still relies on per-object ACLs.
   */
  private objectAcl?: 'public-read' | 'private';
  /** Flipped when S3 tells us ACLs are unsupported, so we stop resending them. */
  private aclRejected = false;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';
    this.publicUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');

    const acl = this.configService.get<string>('AWS_S3_ACL')?.trim();
    this.objectAcl = acl === 'public-read' || acl === 'private' ? acl : undefined;

    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const forcePathStyle = this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true';

    this.s3Client = new S3Client({
      region: this.region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle,
          }
        : {}),
    });

    if (this.bucketName) {
      this.logger.log(`S3 configured: bucket=${this.bucketName}, region=${this.region}`);
    } else {
      this.logger.warn('AWS_S3_BUCKET_NAME not configured');
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    workspaceId?: string,
  ): Promise<UploadResult> {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    // Never derive the key from the uploaded filename: it is attacker-controlled
    // and would let a caller write outside the intended prefix (`../`) or
    // overwrite another workspace's object. Only the extension is carried over,
    // and only after being reduced to safe characters.
    const fileExtension = this.safeExtension(file.originalname, file.mimetype);
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = workspaceId
      ? `${folder}/${workspaceId}/${fileName}`
      : `${folder}/${fileName}`;

    try {
      await this.putObject(key, file);

      const url = this.getPublicUrl(key);
      this.logger.log(`File uploaded: ${key}`);

      return { url, key, bucket: this.bucketName };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * PutObject, retrying once without the ACL when the bucket has ACLs disabled.
   *
   * Without this an upload against a modern bucket fails with a message
   * ("AccessControlListNotSupported") that says nothing about which setting to
   * change, and the feature simply appears broken.
   */
  private async putObject(key: string, file: Express.Multer.File): Promise<void> {
    const base = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Assets are immutable — the key contains a uuid — so they can be cached
      // indefinitely. Without this every page view re-fetches every image.
      CacheControl: 'public, max-age=31536000, immutable',
    };

    const useAcl = this.objectAcl && !this.aclRejected;

    try {
      await this.s3Client.send(
        new PutObjectCommand(useAcl ? { ...base, ACL: this.objectAcl } : base),
      );
    } catch (error) {
      const name = (error as any)?.name ?? (error as any)?.Code;
      if (useAcl && name === 'AccessControlListNotSupported') {
        this.logger.warn(
          'Bucket has ACLs disabled (Object Ownership = BucketOwnerEnforced). ' +
            'Retrying without ACL and dropping AWS_S3_ACL for the rest of this process — ' +
            'grant public read with a bucket policy or serve via CloudFront instead.',
        );
        this.aclRejected = true;
        await this.s3Client.send(new PutObjectCommand(base));
        return;
      }
      throw error;
    }
  }

  /**
   * Extension for the stored key, chosen from the detected content type and
   * falling back to a sanitised form of the original. Anything unrecognised gets
   * no extension at all rather than whatever the client claimed.
   */
  private safeExtension(originalName: string, mimetype: string): string {
    const byMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/avif': '.avif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
    };
    if (byMime[mimetype]) return byMime[mimetype];

    const raw = originalName.includes('.') ? originalName.split('.').pop() ?? '' : '';
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    return cleaned ? `.${cleaned}` : '';
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get presigned URL for private file access
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

