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

import { createTheme } from '@mui/material/styles';

import { LIGHTSPEED_FAB_ANCHOR_VARS } from '../../const';
import {
  clearLightspeedFabAnchorVars,
  getLightspeedDockedDrawerGutter,
  getLightspeedFabEdgeInset,
  getLightspeedOverlayGap,
  publishLightspeedFabAnchorVars,
} from '../fab-anchor-utils';

const theme = createTheme();

describe('fab-anchor-utils', () => {
  beforeEach(() => {
    clearLightspeedFabAnchorVars();
  });

  afterEach(() => {
    clearLightspeedFabAnchorVars();
  });

  it('uses theme spacing tokens for edge inset and gaps', () => {
    expect(getLightspeedFabEdgeInset(theme)).toBe(theme.spacing(2));
    expect(getLightspeedOverlayGap(theme)).toBe(theme.spacing(2));
    expect(getLightspeedDockedDrawerGutter(theme)).toBe(theme.spacing(3));
  });

  it('publishes measured FAB anchor vars on :root', () => {
    const fab = document.createElement('div');
    fab.getBoundingClientRect = () =>
      ({
        width: 48,
        height: 48,
        top: 900,
        left: 1200,
        right: 1248,
        bottom: 948,
        x: 1200,
        y: 900,
        toJSON: () => ({}),
      }) as DOMRect;

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
    });

    publishLightspeedFabAnchorVars({ fabElement: fab, theme });

    const root = document.documentElement;
    expect(
      root.style.getPropertyValue(LIGHTSPEED_FAB_ANCHOR_VARS.overlayGap),
    ).toBe(theme.spacing(2));
    expect(
      root.style.getPropertyValue(
        LIGHTSPEED_FAB_ANCHOR_VARS.dockedDrawerGutter,
      ),
    ).toBe(theme.spacing(3));
    expect(
      root.style.getPropertyValue(LIGHTSPEED_FAB_ANCHOR_VARS.insetBlockEnd),
    ).toBe('52px');
    expect(
      root.style.getPropertyValue(LIGHTSPEED_FAB_ANCHOR_VARS.insetInlineEnd),
    ).toBe('32px');
    expect(root.style.getPropertyValue(LIGHTSPEED_FAB_ANCHOR_VARS.height)).toBe(
      '48px',
    );
  });

  it('clears all published anchor vars', () => {
    const fab = document.createElement('div');
    fab.getBoundingClientRect = () =>
      ({
        width: 48,
        height: 48,
        top: 0,
        left: 0,
        right: 48,
        bottom: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    publishLightspeedFabAnchorVars({ fabElement: fab, theme });
    clearLightspeedFabAnchorVars();

    const root = document.documentElement;
    Object.values(LIGHTSPEED_FAB_ANCHOR_VARS).forEach(varName => {
      expect(root.style.getPropertyValue(varName)).toBe('');
    });
  });
});
