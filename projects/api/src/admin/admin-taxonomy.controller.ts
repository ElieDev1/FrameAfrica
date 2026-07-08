import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { AdminTaxonomyService } from './admin-taxonomy.service';
import {
  CreateCategoryDto,
  CreateTopicDto,
  UpdateCategoryDto,
  UpdateTopicDto,
} from './dto/taxonomy.dto';

/** Admin CRUD for sections/sub-sections and topics/tags. */
@Controller('admin/taxonomy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class AdminTaxonomyController {
  constructor(private readonly taxonomy: AdminTaxonomyService) {}

  @Get('categories')
  async listCategories() {
    return apiResponse(await this.taxonomy.listCategories());
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return apiResponse(await this.taxonomy.createCategory(dto));
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return apiResponse(await this.taxonomy.updateCategory(id, dto));
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.taxonomy.deleteCategory(id));
  }

  @Get('topics')
  async listTopics() {
    return apiResponse(await this.taxonomy.listTopics());
  }

  @Post('topics')
  async createTopic(@Body() dto: CreateTopicDto) {
    return apiResponse(await this.taxonomy.createTopic(dto));
  }

  @Patch('topics/:id')
  async updateTopic(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTopicDto) {
    return apiResponse(await this.taxonomy.updateTopic(id, dto));
  }

  @Delete('topics/:id')
  async deleteTopic(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.taxonomy.deleteTopic(id));
  }
}
