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

import styles from './CustomDrawer.module.css';

/**
 * @internal
 */
export type CustomDrawerProps = {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  isDrawerOpen: boolean;
  drawerWidth?: number;
  onWidthChange?: (width: number) => void;
  [key: string]: any;
};

/**
 * @internal
 */
export const CustomDrawer = (props: CustomDrawerProps) => {
  const {
    children,
    minWidth: _minWidth = 400,
    maxWidth: _maxWidth = 800,
    initialWidth = 400,
    isDrawerOpen,
    drawerWidth,
    onWidthChange: _onWidthChange,
  } = props;

  const width = drawerWidth || initialWidth;

  return (
    <aside
      className={[styles.root, isDrawerOpen ? styles.open : '']
        .filter(Boolean)
        .join(' ')}
      style={{ width }}
      aria-hidden={!isDrawerOpen}
    >
      <div className={styles.content}>{children}</div>
    </aside>
  );
};
