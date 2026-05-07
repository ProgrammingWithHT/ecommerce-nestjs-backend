import { BadRequestException, Injectable } from '@nestjs/common';
import type { UploadApiResponse } from 'cloudinary';
import { SerializedFileDto } from '../contracts/files/serialized-file.dto';
import cloudinary from './cloudinary.config';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: SerializedFileDto | string,
    folder = 'products',
  ): Promise<UploadApiResponse> {
    if (typeof file === 'string') {
      return cloudinary.uploader.upload(file, { folder });
    }

    if (file.bufferBase64) {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
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

        uploadStream.end(Buffer.from(file.bufferBase64, 'base64'));
      });
    }

    throw new BadRequestException('No file data was provided for upload');
  }

  async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
