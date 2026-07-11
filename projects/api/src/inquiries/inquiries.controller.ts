import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InquiryStatus, InquiryType, RoleName } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { InquiriesService } from './inquiries.service';

@Controller()
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  /** Public footer-form submission — tightly rate-limited to deter spam. */
  @Post('inquiries')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async submit(@Body() dto: CreateInquiryDto) {
    return apiResponse(await this.inquiries.submit(dto));
  }

  /** Admin inbox — advertising + contact messages, filterable. */
  @Get('admin/inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.admin)
  async list(@Query('type') type?: string, @Query('status') status?: string) {
    return apiResponse(
      await this.inquiries.list({
        type: isType(type) ? type : undefined,
        status: isStatus(status) ? status : undefined,
      }),
    );
  }

  @Patch('admin/inquiries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.admin)
  async setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInquiryDto) {
    return apiResponse(await this.inquiries.setStatus(id, dto.status));
  }
}

function isType(v?: string): v is InquiryType {
  return !!v && (Object.values(InquiryType) as string[]).includes(v);
}
function isStatus(v?: string): v is InquiryStatus {
  return !!v && (Object.values(InquiryStatus) as string[]).includes(v);
}
