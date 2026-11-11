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
import {
  boundSnapshot,
  createFailedSnapshot,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { discoverIndex } from './discoverIndex';
import { processArtifacts } from './processArtifacts';
import type { NpxSourceConfig } from './types';

/** Maximum duration for a source refresh, including artifact processing. */
const REFRESH_DEADLINE_MS = 5 * 60 * 1_000;

/**
 * Runs a single source refresh: discover, retrieve artifacts, verify,
 * normalize, and publish the snapshot atomically.
 *
 * Exported for testing; not part of the public package API.
 *
 * @internal
 */
export async function refreshSource(
  source: NpxSourceConfig,
  snapshots: Map<string, SkillSnapshot>,
  logger: LoggerService,
  abortSignal?: AbortSignal,
): Promise<void> {
  logger.info(`Starting refresh for source '${source.id}'`);
  const deadlineSignal = AbortSignal.timeout(REFRESH_DEADLINE_MS);
  const signal = abortSignal
    ? AbortSignal.any([abortSignal, deadlineSignal])
    : deadlineSignal;

  try {
    // Discover entries from the index
    const discovery = await discoverIndex(source, logger, signal);

    if (!discovery.hasUsablePage) {
      // No index page could be parsed, so there is no usable discovery result
      const snapshot = createFailedSnapshot(
        { id: source.id, type: 'npx' },
        new Date().toISOString(),
      );
      // Preserve any failed keys from partial discovery for diagnostics
      if (discovery.failedKeys.length > 0) {
        snapshot.failedSkillKeys = [...discovery.failedKeys];
      }
      snapshots.set(source.id, snapshot);
      logger.error(`Discovery failed for source '${source.id}'`);
      return;
    }

    // Process artifacts for discovered entries
    const processing = await processArtifacts(
      discovery.entries,
      source,
      logger,
      signal,
    );

    // Combine failed keys from discovery and artifact processing
    const allFailedKeys = [...discovery.failedKeys, ...processing.failedKeys];

    // Discovery is complete only if both phases completed without failures
    const discoveryComplete =
      discovery.complete &&
      processing.failedKeys.length === 0 &&
      !signal.aborted;

    const observedAt = new Date().toISOString();

    const snapshot = boundSnapshot({
      source: { id: source.id, type: 'npx' },
      records: processing.records,
      failedSkillKeys: allFailedKeys,
      discoveryComplete,
      observedAt,
    });

    // Publish atomically
    snapshots.set(source.id, snapshot);

    logger.info(
      `Refresh complete for source '${source.id}': ` +
        `status=${snapshot.status}, ` +
        `skills=${snapshot.skills.length}, ` +
        `failedKeys=${snapshot.failedSkillKeys.length}`,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      `Unexpected error during refresh for source '${source.id}': ${detail}`,
    );
    snapshots.set(
      source.id,
      createFailedSnapshot(
        { id: source.id, type: 'npx' },
        new Date().toISOString(),
      ),
    );
  }
}
