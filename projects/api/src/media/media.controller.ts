import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';
import type { UploadedImage } from './media.types';

/** Media library (DAM). Staff-only: upload images and browse the library. */
@Controller('cms/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  RoleName.journalist,
  RoleName.photographer,
  RoleName.sub_editor,
  RoleName.editor,
  RoleName.admin,
)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedImage | undefined,
    @Body() dto: UploadMediaDto,
  ) {
    return apiResponse(await this.media.upload(user.id, file, dto));
  }

  @Get()
  async list() {
    return apiResponse(await this.media.list());
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(RoleName.editor, RoleName.admin)
  async remove(@Param('id') id: string) {
    await this.media.remove(id);
  }
}
