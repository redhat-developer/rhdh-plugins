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

import { BUITokens } from '../types';

/**
 * Maps structured BUI token config values to CSS custom properties.
 * Uses !important to override BUI's @layer tokens.
 */
export const buiTokensToCSS = (tokens: BUITokens): Record<string, string> => {
  const set = (value: string) => value;
  const css: Record<string, string> = {};
  if (tokens.primary) css['--bui-bg-solid'] = set(tokens.primary);
  if (tokens.warning) css['--bui-fg-warning'] = set(tokens.warning);
  if (tokens.error) css['--bui-fg-danger'] = set(tokens.error);
  if (tokens.success) css['--bui-fg-success'] = set(tokens.success);
  if (tokens.info) css['--bui-fg-info'] = set(tokens.info);
  if (tokens.fontFamily) css['--bui-font-regular'] = set(tokens.fontFamily);
  if (tokens.fontFamilyMonospace)
    css['--bui-font-monospace'] = set(tokens.fontFamilyMonospace);
  if (tokens.borderColor) css['--bui-border-1'] = set(tokens.borderColor);
  if (tokens.backgroundColor)
    css['--bui-bg-neutral-1'] = set(tokens.backgroundColor);
  if (tokens.foregroundPrimary)
    css['--bui-fg-primary'] = set(tokens.foregroundPrimary);
  if (tokens.foregroundSecondary)
    css['--bui-fg-secondary'] = set(tokens.foregroundSecondary);
  if (tokens.foregroundDisabled)
    css['--bui-fg-disabled'] = set(tokens.foregroundDisabled);
  if (tokens.focusRing) css['--bui-ring'] = set(tokens.focusRing);
  if (tokens.shadow) css['--bui-shadow'] = set(tokens.shadow);
  return css;
};
