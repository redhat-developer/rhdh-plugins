/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AuditorService, HttpAuthService } from '@backstage/backend-plugin-api';
import { DEFAULT_NOTIFICATION_FREQUENCY } from '@red-hat-developer-hub/backstage-plugin-adoption-insights-common';
import { Request, Response } from 'express';
import { NotificationPreferenceStore } from '../database/NotificationPreferenceStore';
import { NotificationPreferenceSchema } from '../validation/notification-preference';

export class NotificationPreferenceController {
  constructor(
    private readonly store: NotificationPreferenceStore,
    private readonly auditor: AuditorService,
    private readonly httpAuth: HttpAuthService,
  ) {}

  async getPreference(req: Request, res: Response): Promise<void> {
    const credentials = await this.httpAuth.credentials(req, {
      allow: ['user'],
    });
    const frequency = await this.store.get(credentials.principal.userEntityRef);
    res.status(200).json({
      frequency: frequency ?? DEFAULT_NOTIFICATION_FREQUENCY,
    });
  }

  async updatePreference(req: Request, res: Response): Promise<void> {
    const auditEvent = await this.auditor.createEvent({
      eventId: 'notification-preference-update',
      severityLevel: 'medium',
      request: req,
    });

    const parsed = NotificationPreferenceSchema.safeParse(req.body);
    if (!parsed.success) {
      auditEvent.fail({ error: parsed.error });
      const { fieldErrors, formErrors } = parsed.error.flatten();
      res.status(400).json({
        message: 'Invalid notification preference',
        errors: fieldErrors,
        formErrors,
      });
      return;
    }

    try {
      const credentials = await this.httpAuth.credentials(req, {
        allow: ['user'],
      });
      const { frequency } = parsed.data;
      const { previous } = await this.store.set(
        credentials.principal.userEntityRef,
        frequency,
      );
      auditEvent.success({
        meta: {
          frequency,
          previousFrequency: previous ?? DEFAULT_NOTIFICATION_FREQUENCY,
        },
      });
      res.status(200).json({ frequency });
    } catch (error) {
      auditEvent.fail({
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }
}
