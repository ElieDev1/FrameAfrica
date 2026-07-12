import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { pagination, readPaging } from '../common/http/paging';
import { CreateAlbumDto, SetAssetAlbumDto, UpdateAlbumDto } from './dto/album.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import type { AlbumFilter, KindFilter } from './media.service';
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

  /** Upload an audio or video file (podcasts, self-hosted clips). */
  @Post('av')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAV(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedImage | undefined,
    @Body() dto: UploadMediaDto,
  ) {
    return apiResponse(await this.media.uploadAV(user.id, file, dto));
  }

  /**
   * Browse the library, a page at a time. `?album=<id|unfiled>` narrows to one
   * album (or the unfiled pile); `?kind=image|video|audio` narrows to a type.
   */
  @Get()
  async list(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('album') album?: string,
    @Query('kind') kind?: string,
  ) {
    const paging = readPaging(limit, page, 24);
    const { items, hasMore } = await this.media.list(
      paging.limit,
      paging.page,
      album as AlbumFilter,
      asKind(kind),
    );
    return apiResponse(items, pagination(paging.page, hasMore));
  }

  // ── Albums (photographer-led, any staffer may file) ───────────────────────

  /** Albums with counts + covers, the unfiled tally, and the by-kind breakdown. */
  @Get('albums')
  async albums() {
    const [albums, unfiled, counts] = await Promise.all([
      this.media.listAlbums(),
      this.media.unfiledCount(),
      this.media.counts(),
    ]);
    return apiResponse({ albums, unfiled, counts });
  }

  @Post('albums')
  async createAlbum(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAlbumDto) {
    return apiResponse(await this.media.createAlbum(user.id, dto));
  }

  @Patch('albums/:id')
  async updateAlbum(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAlbumDto) {
    return apiResponse(await this.media.updateAlbum(id, dto));
  }

  /** Deleting an album unfiles its files — it never deletes them. */
  @Delete('albums/:id')
  @HttpCode(204)
  @Roles(RoleName.photographer, RoleName.editor, RoleName.admin)
  async deleteAlbum(@Param('id', ParseUUIDPipe) id: string) {
    await this.media.deleteAlbum(id);
  }

  /** Move a file into an album (or send `albumId: null` to unfile it). */
  @Patch(':id/album')
  async setAssetAlbum(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetAssetAlbumDto) {
    return apiResponse(await this.media.setAssetAlbum(id, dto.albumId ?? null));
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(RoleName.editor, RoleName.admin)
  async remove(@Param('id') id: string) {
    await this.media.remove(id);
  }
}

/** Only the three kinds the explorer tabs offer; anything else means "all". */
function asKind(value?: string): KindFilter {
  return value === 'image' || value === 'video' || value === 'audio' ? value : undefined;
}
