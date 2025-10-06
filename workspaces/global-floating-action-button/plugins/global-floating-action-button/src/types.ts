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

/**
 * Slot
 *
 * @public
 */
export enum Slot {
  /**
   * Positions the floating action button in the bottom-right corner of the page
   */
  PAGE_END = 'page-end',
  /**
   * Positions the floating action button at the bottom center of the page
   */
  BOTTOM_LEFT = 'bottom-left',
}

/**
 * Floating Action Button
 *
 * @public
 */
export type FloatingActionButton = {
  slot?: Slot;
  label: string;
  labelKey?: string;
  showLabel?: boolean;
  icon?: string | React.ReactElement;
  size?: 'small' | 'medium' | 'large';
  color?:
    | 'default'
    | 'error'
    | 'info'
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning';
  iconColor?: string;
  onClick?: React.MouseEventHandler;
  to?: string;
  toolTip?: string;
  toolTipKey?: string;
  priority?: number;
  visibleOnPaths?: string[];
  excludeOnPaths?: string[];
};

/**
 * Floating Action Button With Positions
 *
 * @public
 */
export type FloatingActionButtonWithPositions = Array<{
  slot: Slot;
  actions: FloatingActionButton[];
}>;

/**
 * FAB Mount Point
 *
 * @public
 */
export type FABMountPoint = {
  config?: FloatingActionButton;
};
