import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private storage: Storage;
  private avatarsBucket: string;
  private profileVideosBucket: string;
  private walletDocumentsBucket: string;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage();
    this.avatarsBucket =
      this.configService.get<string>('gcs.avatarsBucket') || 'tribr-avatars';
    this.profileVideosBucket =
      this.configService.get<string>('gcs.profileVideosBucket') ||
      'tribr-profile-videos';
    this.walletDocumentsBucket =
      this.configService.get<string>('gcs.walletDocumentsBucket') ||
      'wallet-documents';
  }

  getAvatarsBucket() {
    return this.avatarsBucket;
  }

  getProfileVideosBucket() {
    return this.profileVideosBucket;
  }

  getWalletDocumentsBucket() {
    return this.walletDocumentsBucket;
  }

  /**
   * Upload a buffer to a GCS bucket and return its public URL.
   */
  async uploadPublicFile(
    bucketName: string,
    destination: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(destination);
      await file.save(buffer, {
        contentType,
        resumable: false,
      });
      await file.makePublic();
      return file.publicUrl();
    } catch (error) {
      console.error('GCS upload error:', error);
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  /**
   * Delete a file from a bucket using a known path (relative to bucket root).
   */
  async deleteFile(bucketName: string, filePath: string) {
    try {
      const bucket = this.storage.bucket(bucketName);
      await bucket.file(filePath).delete({ ignoreNotFound: true });
    } catch (error) {
      console.error('GCS delete error:', error);
      // Do not throw: deletion failures shouldn't block business flow
    }
  }

  /**
   * Extract the object path from a full URL for a known bucket.
   */
  extractPathFromUrl(bucketName: string, fileUrl: string): string | null {
    const marker = `${bucketName}/`;
    const idx = fileUrl.indexOf(marker);
    if (idx === -1) return null;
    return fileUrl.substring(idx + marker.length);
  }
}
