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
 * Drawer content contributed by a plugin via AppDrawerContentBlueprint.
 *
 * @public
 */
export interface AppDrawerContent {
  /** Unique identifier for this drawer. */
  id: string;
  /** React element to render as the drawer body. */
  element: React.ReactElement;
  /** Whether the drawer supports user-resizable width. */
  resizable?: boolean;
  /** Initial drawer width in pixels. */
  defaultWidth?: number;
  /** Ordering priority when multiple drawers are registered. Higher = first. */
  priority?: number;
}

/**
 * Public API surface exposed by useAppDrawer().
 *
 * @public
 */
export interface AppDrawerApi {
  /** Open a drawer by id. Closes any other open drawer. */
  openDrawer(id: string): void;
  /** Close a drawer by id (only if it is the active drawer). */
  closeDrawer(id: string): void;
  /** Toggle a drawer: open if closed, close if open. */
  toggleDrawer(id: string): void;
  /** Check whether a specific drawer is currently open. */
  isOpen(id: string): boolean;
  /** The id of the currently active drawer, or null. */
  activeDrawerId: string | null;
  /** Get the current width for a drawer. Returns defaultWidth or fallback if unset. */
  getWidth(id: string): number;
  /** Set the width for a drawer (persists for the session). */
  setWidth(id: string, width: number): void;
}
