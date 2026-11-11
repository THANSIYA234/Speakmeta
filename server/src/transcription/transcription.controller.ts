import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { TranscriptionService } from './transcription.service';

export interface TranscriptionResponse {
  text: string;
  language: string | null;
  durationSeconds: number | null;
  provider: string;
}

/**
 * The upload endpoint.
 *
 * `FileInterceptor` keeps the file in memory rather than on disk: the bytes are
 * needed by the provider, and a temporary file would only have to be cleaned up
 * again. The size limit is enforced twice — by multer, so an oversized upload
 * is rejected while it streams in, and by the service, so the rule holds
 * whatever path the file arrived on.
 */
@Controller('transcription')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async transcribe(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('language') language?: string,
  ): Promise<TranscriptionResponse> {
    const payload = await this.transcriptionService.transcribe({
      buffer: file?.buffer,
      mimetype: file?.mimetype,
      originalname: file?.originalname,
      language,
    });

    return {
      text: payload.text,
      language: payload.language,
      durationSeconds: payload.durationSeconds,
      provider: payload.provider,
    };
  }

  /** Cheap health check that also reports which provider is wired up. */
  @Get('provider')
  providerInfo(): { provider: string } {
    return { provider: this.transcriptionService.providerName };
  }
}
