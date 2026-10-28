import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetType } from '../entities/asset.entity';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { S3Service } from '../storage/s3.service';
import { imageSize } from 'image-size';
import type { Express } from 'express-serve-static-core';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    private s3Service: S3Service,
  ) {}

  async uploadAsset(
    user: User,
    workspaceId: string,
    file: Express.Multer.File,
    alt?: string,
  ): Promise<Asset> {
    // Verify workspace access
    const workspace = await this.workspacesRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Determine asset type
    const assetType = this.getAssetType(file.mimetype);

    // Upload to S3
    const uploadResult = await this.s3Service.uploadFile(file, 'assets', workspaceId);

    // Get image dimensions if it's an image
    let width: number | null = null;
    let height: number | null = null;

    if (assetType === AssetType.IMAGE) {
      // Header-only dimension read. This used to go through sharp, which pulls
      // in libvips: ~16MB of platform binaries on disk and ~22MB of resident
      // memory in every process that imports it, to produce two integers.
      // `image-size` parses just the header bytes and covers every format in
      // ALLOWED_UPLOAD_MIMES (jpeg, png, webp, gif, avif).
      try {
        const dimensions = imageSize(file.buffer);
        width = dimensions.width || null;
        height = dimensions.height || null;
      } catch (error) {
        // Unreadable header — the upload still succeeds, just without dimensions.
      }
    }

    // Save to database
    const assetData: Partial<Asset> = {
      workspaceId,
      type: assetType,
      url: uploadResult.url,
      width: width ?? undefined,
      height: height ?? undefined,
      alt: alt || file.originalname,
    };

    const asset = this.assetsRepository.create(assetData);
    const savedAsset = await this.assetsRepository.save(asset);
    return savedAsset;
  }

  async deleteAsset(user: User, assetId: string): Promise<void> {
    const asset = await this.assetsRepository.findOne({
      where: { id: assetId },
      relations: ['workspace', 'workspace.owner'],
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Extract key from URL
    const key = this.extractKeyFromUrl(asset.url);

    // Delete from S3
    if (key) {
      await this.s3Service.deleteFile(key);
    }

    // Delete from database
    await this.assetsRepository.remove(asset);
  }

  async findAll(user: User, workspaceId?: string): Promise<Asset[]> {
    const where: any = {};

    if (workspaceId) {
      const workspace = await this.workspacesRepository.findOne({
        where: { id: workspaceId },
        relations: ['owner'],
      });

      if (!workspace || workspace.ownerId !== user.id) {
        throw new ForbiddenException('Access denied');
      }

      where.workspaceId = workspaceId;
    } else {
      // Get user's workspaces
      const workspaces = await this.workspacesRepository.find({
        where: { ownerId: user.id },
      });
      where.workspaceId = workspaces.map((w) => w.id);
    }

    return this.assetsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(user: User, assetId: string): Promise<Asset> {
    const asset = await this.assetsRepository.findOne({
      where: { id: assetId },
      relations: ['workspace', 'workspace.owner'],
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return asset;
  }

  private getAssetType(mimetype: string): AssetType {
    if (mimetype.startsWith('image/')) {
      return AssetType.IMAGE;
    }
    if (mimetype.startsWith('video/')) {
      return AssetType.VIDEO;
    }
    if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text')) {
      return AssetType.DOCUMENT;
    }
    return AssetType.OTHER;
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      // Extract key from S3 URL
      // Format: https://bucket.s3.region.amazonaws.com/folder/key
      // or: https://cdn.example.com/folder/key
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading '/'
    } catch {
      return null;
    }
  }
}
