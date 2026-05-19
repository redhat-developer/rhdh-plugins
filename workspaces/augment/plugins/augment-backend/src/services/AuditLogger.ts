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

import type { LoggerService } from '@backstage/backend-plugin-api';

export type AuditAction =
  | 'config.update'
  | 'config.delete'
  | 'session.create'
  | 'session.delete'
  | 'tool.approval'
  | 'agent.lifecycle'
  | 'document.upload'
  | 'document.delete'
  | 'admin.login';

export interface AuditEvent {
  action: AuditAction;
  actor: string;
  target?: string;
  outcome: 'success' | 'failure';
  meta?: Record<string, unknown>;
}

export class AuditLogger {
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.child({ label: 'audit' });
  }

  log(event: AuditEvent): void {
    const record = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.logger.info(JSON.stringify(record));
  }
}
