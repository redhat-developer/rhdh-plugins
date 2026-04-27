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

import type { Config } from '@backstage/config';
import {
  type ThresholdConfig,
  ScorecardThresholdRuleColors,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type FilecheckEntry = {
  id: string;
  path: string;
};

export type FilecheckConfig = {
  files: FilecheckEntry[];
};

export const DEFAULT_FILECHECK_THRESHOLDS: ThresholdConfig = {
  rules: [
    {
      key: 'exist',
      expression: '==true',
      color: ScorecardThresholdRuleColors.SUCCESS,
      icon: 'scorecardSuccessStatusIcon',
    },
    {
      key: 'missing',
      expression: '==false',
      color: ScorecardThresholdRuleColors.ERROR,
      icon: 'scorecardErrorStatusIcon',
    },
  ],
};

const INVALID_PATH_CHARS = /[\n\r"\\]/;

export function validateFilePath(id: string, path: string): void {
  if (INVALID_PATH_CHARS.test(path)) {
    throw new Error(
      `Invalid file path for '${id}': path must not contain newlines, quotes, or backslashes`,
    );
  }
  if (path.startsWith('/') || path.startsWith('./') || path.startsWith('../')) {
    throw new Error(
      `Invalid file path for '${id}': path must be relative without leading './', '../' or '/'`,
    );
  }
}

/**
 * Parses the filecheck configuration from the root Backstage config.
 * Returns undefined if no files are configured.
 */
export function parseFilecheckConfig(
  config: Config,
): FilecheckConfig | undefined {
  const filesConfig = config.getOptionalConfig(
    'scorecard.plugins.filecheck.files',
  );

  if (!filesConfig) {
    return undefined;
  }

  const ids = filesConfig.keys();

  if (ids.length === 0) {
    return undefined;
  }

  const files: FilecheckEntry[] = ids.map(id => {
    const path = filesConfig.getString(id);
    validateFilePath(id, path);
    return { id, path };
  });

  return { files };
}
