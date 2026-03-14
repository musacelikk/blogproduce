import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

@Injectable()
export class UnsplashService {
  private readonly logger = new Logger(UnsplashService.name);
  private readonly accessKey: string;
  private readonly baseUrl = 'https://api.unsplash.com';

  constructor(private configService: ConfigService) {
    this.accessKey = this.configService.get<string>('UNSPLASH_ACCESS_KEY') || '';
    if (!this.accessKey) {
      this.logger.warn('UNSPLASH_ACCESS_KEY not configured');
    }
  }

  async searchPhotos(query: string, perPage: number = 8, page: number = 1): Promise<UnsplashPhoto[]> {
    if (!this.accessKey) {
      this.logger.error('UNSPLASH_ACCESS_KEY is not configured');
      throw new Error('Unsplash API key not configured. Please set UNSPLASH_ACCESS_KEY environment variable.');
    }

    try {
      const url = `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`;
      this.logger.debug(`Searching Unsplash with URL: ${url.replace(this.accessKey, '***')}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Unsplash API error: ${response.status} - ${errorText}`);
        throw new Error(`Unsplash API error: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const data: UnsplashSearchResponse = await response.json();
      this.logger.debug(`Unsplash search returned ${data.results?.length || 0} photos (page ${page})`);
      return data.results || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error searching Unsplash photos: ${errorMessage}`);
      throw error;
    }
  }

  async triggerDownload(photoId: string): Promise<void> {
    if (!this.accessKey) {
      throw new Error('Unsplash API key not configured');
    }

    try {
      const secretKey = this.configService.get<string>('UNSPLASH_SECRET_KEY');
      if (!secretKey) {
        this.logger.warn('UNSPLASH_SECRET_KEY not configured, download tracking may not work');
        return;
      }

      // Trigger download tracking (async, don't wait for response)
      fetch(`${this.baseUrl}/photos/${photoId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`,
        },
      }).catch((err) => {
        this.logger.warn(`Failed to trigger download tracking: ${err.message}`);
      });
    } catch (error) {
      this.logger.warn(`Error triggering download: ${error.message}`);
      // Don't throw, this is optional
    }
  }
}

