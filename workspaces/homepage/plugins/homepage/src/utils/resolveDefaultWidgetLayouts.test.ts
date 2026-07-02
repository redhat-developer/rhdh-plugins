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

import {
  resolveDefaultWidgetLayout,
  resolveLayoutEntryForBreakpoint,
} from './resolveDefaultWidgetLayouts';

describe('resolveLayoutEntryForBreakpoint', () => {
  it('falls back to xl when a breakpoint is not defined', () => {
    expect(
      resolveLayoutEntryForBreakpoint({ xl: { w: 12, h: 1 } }, 'lg'),
    ).toEqual({ w: 12, h: 1 });
  });
});

describe('resolveDefaultWidgetLayout', () => {
  it('stacks widgets vertically when y is omitted', () => {
    const nextYByBreakpoint = new Map<string, number>();

    expect(
      resolveDefaultWidgetLayout({ w: 12, h: 1 }, 'xl', nextYByBreakpoint),
    ).toEqual({ x: 0, y: 0, w: 12, h: 1 });
    expect(
      resolveDefaultWidgetLayout({ w: 12, h: 1 }, 'xl', nextYByBreakpoint),
    ).toEqual({ x: 0, y: 1, w: 12, h: 1 });
    expect(
      resolveDefaultWidgetLayout({ w: 12, h: 6 }, 'xl', nextYByBreakpoint),
    ).toEqual({ x: 0, y: 2, w: 12, h: 6 });
  });

  it('respects explicit y and advances the auto stack cursor', () => {
    const nextYByBreakpoint = new Map<string, number>();

    resolveDefaultWidgetLayout({ w: 12, h: 1 }, 'xl', nextYByBreakpoint);
    resolveDefaultWidgetLayout(
      { y: 10, w: 6, h: 4, x: 6 },
      'xl',
      nextYByBreakpoint,
    );

    expect(
      resolveDefaultWidgetLayout({ w: 12, h: 3 }, 'xl', nextYByBreakpoint),
    ).toEqual({ x: 0, y: 14, w: 12, h: 3 });
  });

  it('tracks breakpoints independently', () => {
    const nextYByBreakpoint = new Map<string, number>();

    expect(
      resolveDefaultWidgetLayout({ w: 12, h: 2 }, 'xl', nextYByBreakpoint),
    ).toEqual({ x: 0, y: 0, w: 12, h: 2 });
    expect(
      resolveDefaultWidgetLayout({ w: 12, h: 4 }, 'lg', nextYByBreakpoint),
    ).toEqual({ x: 0, y: 0, w: 12, h: 4 });
    expect(
      resolveDefaultWidgetLayout({ w: 12, h: 1 }, 'xl', nextYByBreakpoint),
    ).toEqual({ x: 0, y: 2, w: 12, h: 1 });
  });
});
