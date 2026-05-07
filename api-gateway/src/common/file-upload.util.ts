import { BadRequestException } from '@nestjs/common';
import { SerializedFileDto } from '../../../shared/contracts/files/serialized-file.dto';

type UploadedFileLike = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

export const serializeUploadedFile = (
  file?: UploadedFileLike,
): SerializedFileDto | undefined => {
  if (!file) {
    return undefined;
  }

  if (!file.buffer?.length) {
    throw new BadRequestException('Uploaded file is empty');
  }

  return {
    originalname: file.originalname ?? 'upload',
    mimetype: file.mimetype ?? 'application/octet-stream',
    size: file.size,
    bufferBase64: file.buffer.toString('base64'),
  };
};

export const serializeUploadedFiles = (
  files: UploadedFileLike[] = [],
): SerializedFileDto[] => files.map((file) => serializeUploadedFile(file)!);
