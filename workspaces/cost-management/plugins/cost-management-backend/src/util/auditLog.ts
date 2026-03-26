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

import type { Request } from 'express';
import type { RouterOptions } from '../models/RouterOptions';

export interface AuditEntry {
  actor: string;
  action: string;
  resource: string;
  decision: string;
  filters?: {
    clusters: string[];
    projects: string[];
  };
  meta?: Record<string, unknown>;
}

/**
 * Resolves the user entity ref from a request using the Backstage auth chain.
 * Falls back to 'unknown' if user identity cannot be determined.
 */
export async function resolveActor(
  req: Request,
  options: RouterOptions,
): Promise<string> {
  try {
    const credentials = await options.httpAuth.credentials(req);
    const info = await options.userInfo.getUserInfo(credentials);
    return info.userEntityRef;
  } catch {
    return 'unknown';
  }
}

export function emitAuditLog(options: RouterOptions, entry: AuditEntry): void {
  options.logger.info(JSON.stringify({ audit: true, ...entry }));
}
