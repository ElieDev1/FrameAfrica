import { Controller, Get } from '@nestjs/common';
import { apiResponse } from '../common/http/api-response';
import { AdminSettingsService } from './admin-settings.service';

/**
 * The public slice of the settings admins manage: the social profiles and
 * contact details rendered in the site footer. Deliberately unauthenticated —
 * every value it can return is a link we publish anyway. It is a separate
 * controller from AdminSettingsController precisely so that the admin guard
 * stays on everything else; this route can only ever reach `publicSettings()`,
 * which reads a fixed allow-list of non-secret keys.
 */
@Controller('site/settings')
export class SiteSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  async publicSettings() {
    return apiResponse(await this.settings.publicSettings());
  }
}
