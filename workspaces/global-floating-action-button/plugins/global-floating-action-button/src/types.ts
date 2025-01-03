/*
 * Copyright 2025 The Backstage Authors
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

/**
 * @public
 * Slot
 */

export enum Slot {
  /**
   * Positions the floating action button in the bottom-right corner of the page
   */
  PAGE_END = 'page-end',
  /**
   * Positions the floating action button at the bottom center of the page
   */
  BOTTOM_CENTER = 'bottom-center',
}

/**
 * @public
 * Floating Action Button With Positions
 */

export type FloatingActionButtonWithPositions = Array<{
  slot: Slot;
  actions: FloatingActionButton[];
}>;

/**
 * @public
 * Flex Direction
 */

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

/**
 * @public
 * Floating Action Button
 */
export type FloatingActionButton = {
  label: string;
  showLabel?: boolean;
  icon?: string | React.ReactElement;
  size?: 'small' | 'medium' | 'large';
  position?: Slot | string;
  color?:
    | 'default'
    | 'error'
    | 'info'
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning';
  onClick?: React.MouseEventHandler;
  to?: string;
  toolTip?: string;
  priority?: number;
  visibleOnPaths?: string[];
  excludeOnPaths?: string[];
};
