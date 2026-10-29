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

import { getContrastRatio } from '@mui/material/styles';

/**
 * Same rule as MUI `palette.getContrastText`: prefer white when it meets the
 * contrast threshold, otherwise dark text. Needed because app-config often
 * overrides `primary.main` while deep-merge keeps a stale `contrastText`
 * (e.g. dark default `#151515` for `#92c5f9` left on customized `#0093F0`).
 */
export const contrastTextForBackground = (
  background: string,
  contrastThreshold = 3,
): string => {
  try {
    if (getContrastRatio(background, '#ffffff') >= contrastThreshold) {
      return '#ffffff';
    }
  } catch {
    // Invalid color — fall through to dark text.
  }
  return '#151515';
};
