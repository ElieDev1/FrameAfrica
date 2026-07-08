import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { apiResponse } from '../../common/http/api-response';
import { CmsDraftService } from './cms-draft.service';
import { CmsEditorService } from './cms-editor.service';
import { RejectDto } from './dto/reject.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

/**
 * Sub-editor copy desk (documents/07 UC — "Sub-editor: copy-edit · return to
 * journalist"). A submitted draft lands here (`copy_edit`); a sub-editor polishes
 * the copy, then either passes it to the editors' review queue (`ready`) or
 * returns it to the writer. Editors/admins can also work the desk.
 */
@Controller('cms/copydesk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.sub_editor, RoleName.editor, RoleName.admin)
export class CmsCopydeskController {
  constructor(
    private readonly drafts: CmsDraftService,
    private readonly editor: CmsEditorService,
  ) {}

  @Get()
  async queue() {
    return apiResponse(await this.editor.listCopyDeskQueue());
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.drafts.getForCopyEdit(id));
  }

  @Patch(':id')
  async copyEdit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDraftDto,
  ) {
    return apiResponse(await this.drafts.copyEdit(user.id, id, dto));
  }

  @Post(':id/pass')
  @HttpCode(200)
  async pass(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.editor.passCopyEdit(id));
  }

  @Post(':id/return')
  @HttpCode(200)
  async returnToWriter(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectDto) {
    return apiResponse(await this.editor.returnCopyEdit(id, dto.note));
  }
}
