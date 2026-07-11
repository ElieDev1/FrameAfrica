import { BadRequestException, Injectable } from '@nestjs/common';
import {
  type InquiryStatus,
  type InquiryType,
  NotificationType,
  type Prisma,
} from '@prisma/client';
import { stripText } from '../content/blocks';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInquiryDto } from './dto/create-inquiry.dto';

export interface InquiryItem {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  message: string;
  budget: string | null;
  placement: string | null;
  status: InquiryStatus;
  createdAt: string;
}

/**
 * Public footer-form inquiries — advertisers and general contact messages
 * (documents/14 §4 advertising, §8 contact). Anyone can submit; only admins read
 * and work through the inbox. All free text is markup-stripped on write.
 */
@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submit(dto: CreateInquiryDto): Promise<{ received: boolean }> {
    const name = stripText(dto.name).slice(0, 120);
    const message = stripText(dto.message).slice(0, 5000);
    if (!name || !message) {
      throw new BadRequestException('Name and message are required');
    }
    const inquiry = await this.prisma.inquiry.create({
      data: {
        type: dto.type,
        name,
        email: dto.email.trim().toLowerCase().slice(0, 200),
        company: clean(dto.company, 160),
        subject: clean(dto.subject, 160),
        message,
        budget: clean(dto.budget, 80),
        placement: clean(dto.placement, 80),
      },
    });
    const kind = inquiry.type === 'advertise' ? 'Advertising enquiry' : 'Contact message';
    await this.notifications.notifyRoles(['admin'], {
      type: NotificationType.inquiry_received,
      title: `${kind} from ${name}`,
      body: message.slice(0, 160),
      link: '/dashboard/inquiries',
    });
    return { received: true };
  }

  async list(filter: { type?: InquiryType; status?: InquiryStatus }): Promise<InquiryItem[]> {
    const where: Prisma.InquiryWhereInput = {};
    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    const rows = await this.prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return rows.map(toItem);
  }

  async setStatus(id: string, status: InquiryStatus): Promise<InquiryItem> {
    const updated = await this.prisma.inquiry.update({ where: { id }, data: { status } });
    return toItem(updated);
  }
}

function clean(value: string | undefined, max: number): string | null {
  if (!value) return null;
  return stripText(value).slice(0, max) || null;
}

function toItem(row: {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  message: string;
  budget: string | null;
  placement: string | null;
  status: InquiryStatus;
  createdAt: Date;
}): InquiryItem {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    email: row.email,
    company: row.company,
    subject: row.subject,
    message: row.message,
    budget: row.budget,
    placement: row.placement,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
