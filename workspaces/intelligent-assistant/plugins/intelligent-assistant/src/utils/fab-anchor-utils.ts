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

import type { Theme } from '@mui/material/styles';

import { LIGHTSPEED_FAB_ANCHOR_VARS } from '../const';

/** Viewport edge inset for the FAB anchor wrapper (theme spacing token). */
export const getLightspeedFabEdgeInset = (theme: Theme) => theme.spacing(2);

/** Gap between the FAB and overlay chatbot (theme spacing token). */
export const getLightspeedOverlayGap = (theme: Theme) => theme.spacing(2);

/**
 * Extra gutter between the docked app drawer and shifted FAB/overlay.
 * Matches the legacy app shell `1.5em` gutter using theme spacing.
 */
export const getLightspeedDockedDrawerGutter = (theme: Theme) =>
  theme.spacing(3);

type PublishFabAnchorArgs = {
  fabElement: HTMLElement;
  theme: Theme;
};

/**
 * Publishes FAB anchor metrics on :root for overlay/docked layout.
 * All positioning consumers must read these vars — no duplicate calc logic.
 */
export function publishLightspeedFabAnchorVars({
  fabElement,
  theme,
}: PublishFabAnchorArgs) {
  const root = document.documentElement;
  root.style.setProperty(
    LIGHTSPEED_FAB_ANCHOR_VARS.overlayGap,
    getLightspeedOverlayGap(theme),
  );
  root.style.setProperty(
    LIGHTSPEED_FAB_ANCHOR_VARS.dockedDrawerGutter,
    getLightspeedDockedDrawerGutter(theme),
  );

  const rect = fabElement.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) {
    return;
  }

  root.style.setProperty(
    LIGHTSPEED_FAB_ANCHOR_VARS.insetBlockEnd,
    `${window.innerHeight - rect.bottom}px`,
  );
  root.style.setProperty(
    LIGHTSPEED_FAB_ANCHOR_VARS.insetInlineEnd,
    `${window.innerWidth - rect.right}px`,
  );
  root.style.setProperty(LIGHTSPEED_FAB_ANCHOR_VARS.height, `${rect.height}px`);
}

export function clearLightspeedFabAnchorVars() {
  const root = document.documentElement;
  Object.values(LIGHTSPEED_FAB_ANCHOR_VARS).forEach(varName => {
    root.style.removeProperty(varName);
  });
}
