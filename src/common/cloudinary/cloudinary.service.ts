import { BadRequestException, Injectable } from '@nestjs/common';
import type { UploadApiResponse } from 'cloudinary';
import { Express } from 'express';
import cloudinary from './cloudinary.config';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File | string,
    folder = 'products',
  ): Promise<UploadApiResponse> {
    if (typeof file === 'string') {
      return cloudinary.uploader.upload(file, { folder });
    }

    if (file.buffer?.length) {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(new Error('Cloudinary upload did not return a result'));
              return;
            }

            resolve(result);
          },
        );

        stream.end(file.buffer);
      });
    }

    if (file.path) {
      return cloudinary.uploader.upload(file.path, { folder });
    }

    throw new BadRequestException('No file data was provided for upload');
  }

  async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
