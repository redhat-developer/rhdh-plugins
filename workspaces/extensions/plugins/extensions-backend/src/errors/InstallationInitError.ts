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
import { CustomErrorBase } from '@backstage/errors';

export const InstallationInitErrorReason = {
  INSTALLATION_DISABLED_IN_PRODUCTION: 'INSTALLATION_DISABLED_IN_PRODUCTION',
  INSTALLATION_DISABLED: 'INSTALLATION_DISABLED',
  FILE_CONFIG_VALUE_MISSING: 'FILE_CONFIG_VALUE_MISSING',
  FILE_NOT_EXISTS: 'FILE_NOT_EXISTS',
  INVALID_CONFIG: 'INVALID_CONFIG',
  UNKNOWN: 'UNKNOWN',
} as const;

export type InstallationInitErrorReasonKeys =
  (typeof InstallationInitErrorReason)[keyof typeof InstallationInitErrorReason];

export class InstallationInitError extends CustomErrorBase {
  name = 'InstallationInitError' as const;
  readonly statusCode: number;

  constructor(
    public reason: InstallationInitErrorReasonKeys,
    message: string,
    public cause?: Error,
  ) {
    super(message, cause);
    if (
      this.reason ===
        InstallationInitErrorReason.INSTALLATION_DISABLED_IN_PRODUCTION ||
      this.reason === InstallationInitErrorReason.INSTALLATION_DISABLED
    ) {
      this.statusCode = 503;
    } else {
      this.statusCode = 500;
    }
  }
}
