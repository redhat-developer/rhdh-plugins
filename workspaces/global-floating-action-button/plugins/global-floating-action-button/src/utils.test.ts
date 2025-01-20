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

import { FloatingActionButton, Slot } from './types';
import {
  evaluateFloatingButtonsWithPositions,
  filterAndSortButtons,
  sortButtonsWithPriority,
} from './utils';

const floatingButtons: FloatingActionButton[] = [
  {
    color: 'success',
    icon: 'GitIcon',
    label: 'Git repo',
    to: 'https://github.com/xyz',
    toolTip: 'Git',
  },
  {
    slot: Slot.BOTTOM_LEFT,
    color: 'success',
    icon: 'GitIcon',
    label: 'Add',
    toolTip: 'Add',
    to: 'https://github.com/xyz',
    priority: 100,
  },
  {
    slot: Slot.BOTTOM_LEFT,
    color: 'success',
    icon: 'GitIcon',
    label: 'Menu',
    toolTip: 'Menu',
    to: 'https://github.com/xyz',
    priority: 200,
    visibleOnPaths: ['/test-pathname'],
  },
  {
    color: 'success',
    icon: 'GitIcon',
    label: 'Menu',
    toolTip: 'Menu',
    to: 'https://github.com/xyz',
    priority: 200,
    excludeOnPaths: ['/test-pathname'],
  },
];

describe('Global floating action button utils', () => {
  it('should sort actions based on priority', () => {
    const buttons = sortButtonsWithPriority(floatingButtons);
    expect(buttons).toEqual([
      {
        slot: Slot.BOTTOM_LEFT,
        color: 'success',
        icon: 'GitIcon',
        label: 'Menu',
        toolTip: 'Menu',
        to: 'https://github.com/xyz',
        priority: 200,
        visibleOnPaths: ['/test-pathname'],
      },
      {
        color: 'success',
        icon: 'GitIcon',
        label: 'Menu',
        toolTip: 'Menu',
        to: 'https://github.com/xyz',
        priority: 200,
        excludeOnPaths: ['/test-pathname'],
      },

      {
        slot: Slot.BOTTOM_LEFT,
        color: 'success',
        icon: 'GitIcon',
        label: 'Add',
        toolTip: 'Add',
        to: 'https://github.com/xyz',
        priority: 100,
      },
      {
        color: 'success',
        icon: 'GitIcon',
        label: 'Git repo',
        to: 'https://github.com/xyz',
        toolTip: 'Git',
      },
    ]);
  });

  it('should filter buttons and return actions that should be displayed on a pathname', () => {
    const buttons = filterAndSortButtons(floatingButtons, '/test-pathname');
    expect(buttons).toEqual([
      {
        slot: Slot.BOTTOM_LEFT,
        color: 'success',
        icon: 'GitIcon',
        label: 'Menu',
        toolTip: 'Menu',
        to: 'https://github.com/xyz',
        priority: 200,
        visibleOnPaths: ['/test-pathname'],
      },
      {
        slot: Slot.BOTTOM_LEFT,
        color: 'success',
        icon: 'GitIcon',
        label: 'Add',
        toolTip: 'Add',
        to: 'https://github.com/xyz',
        priority: 100,
      },
      {
        color: 'success',
        icon: 'GitIcon',
        label: 'Git repo',
        to: 'https://github.com/xyz',
        toolTip: 'Git',
      },
    ]);
  });

  it('should evaluate floating buttons in the record along with their positions and an array of actions for floating buttons', () => {
    const buttons = evaluateFloatingButtonsWithPositions(floatingButtons);
    expect(buttons).toEqual([
      {
        slot: Slot.PAGE_END,
        actions: [
          {
            color: 'success',
            icon: 'GitIcon',
            label: 'Git repo',
            to: 'https://github.com/xyz',
            toolTip: 'Git',
          },
          {
            color: 'success',
            icon: 'GitIcon',
            label: 'Menu',
            toolTip: 'Menu',
            to: 'https://github.com/xyz',
            priority: 200,
            excludeOnPaths: ['/test-pathname'],
          },
        ],
      },
      {
        slot: Slot.BOTTOM_LEFT,
        actions: [
          {
            slot: Slot.BOTTOM_LEFT,
            color: 'success',
            icon: 'GitIcon',
            label: 'Add',
            toolTip: 'Add',
            to: 'https://github.com/xyz',
            priority: 100,
          },
          {
            slot: Slot.BOTTOM_LEFT,
            color: 'success',
            icon: 'GitIcon',
            label: 'Menu',
            toolTip: 'Menu',
            to: 'https://github.com/xyz',
            priority: 200,
            visibleOnPaths: ['/test-pathname'],
          },
        ],
      },
    ]);
  });
});
