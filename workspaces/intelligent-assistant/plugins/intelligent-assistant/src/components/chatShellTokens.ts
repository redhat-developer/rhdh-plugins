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

/** Shared PatternFly tokens for chat / notebook floating surfaces. */
export const LIGHTSPEED_FLOATING_BG =
  'var(--pf-t--global--background--color--floating--default)';

export const LIGHTSPEED_CONTENT_BORDER =
  'var(--pf-t--global--border--width--regular) solid var(--pf-t--global--border--color--default)';

/** PF6 icons (e.g. PencilAltIcon) ship FA + nested RH UI layers — hide duplicate glyph. */
export const pf6HideNestedRhUiIconCss = {
  '& .pf-v6-svg > .pf-v6-icon-rh-ui': {
    display: 'none !important',
  },
} as const;
