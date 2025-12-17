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

import { ComponentType } from 'react';
import {
  useApplicationDrawerContext,
  ResizableDrawer,
} from '@red-hat-developer-hub/backstage-plugin-application-drawer';

type DrawerContentType = {
  id: string;
  Component: ComponentType<any>;
  priority?: number;
  resizable?: boolean;
};

export const ApplicationDrawer = ({
  drawerContents,
}: {
  drawerContents: DrawerContentType[];
}) => {
  const { getDrawers } = useApplicationDrawerContext();

  // Get active drawer - compute fresh each render since we use refs
  const drawers = getDrawers();
  const activeDrawer = drawers
    .filter(p => p.isDrawerOpen)
    .map(p => {
      const content = drawerContents.find(c => c.id === p.id);
      if (!content) return null;
      return { ...p, ...content };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.priority ?? -1) - (a?.priority ?? -1))[0];

  if (!activeDrawer) return null;

  const { Component, resizable, drawerWidth, setDrawerWidth } = activeDrawer;
  return (
    <ResizableDrawer
      isDrawerOpen
      isResizable={resizable}
      drawerWidth={drawerWidth}
      onWidthChange={setDrawerWidth}
    >
      <Component />
    </ResizableDrawer>
  );
};
