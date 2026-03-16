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
import type { ILogger } from '@augment-adk/augment-adk';

/**
 * Wraps a Backstage `LoggerService` to satisfy the ADK `ILogger` interface.
 */
export function toAdkLogger(backstageLogger: LoggerService): ILogger {
  return {
    info: (msg, meta) =>
      backstageLogger.info(msg, meta as Record<string, string>),
    warn: (msg, meta) =>
      backstageLogger.warn(msg, meta as Record<string, string>),
    error: (msg, meta) =>
      backstageLogger.error(msg, meta as Record<string, string>),
    debug: (msg, meta) =>
      backstageLogger.debug(msg, meta as Record<string, string>),
  };
}
