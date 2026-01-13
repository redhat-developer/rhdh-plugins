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

import type { ReactElement } from 'react';
import { createDevApp, DevAppPageOptions } from '@backstage/dev-utils';
import AddIcon from '@mui/icons-material/Add';
import GitIcon from '@mui/icons-material/GitHub';
import MenuIcon from '@mui/icons-material/Menu';
import { GitHubIcon } from '@backstage/core-components';
import { ScalprumContext, ScalprumState } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';

import { ExampleComponent } from './ExampleComponent/ExampleComponent';
import {
  DynamicGlobalFloatingActionButton,
  FloatingActionButton,
  Slot,
  globalFloatingActionButtonPlugin,
  globalFloatingActionButtonTranslations,
} from '../src';

const mockFloatingButtons: FloatingActionButton[] = [
  {
    color: 'success',
    icon: <GitIcon />,
    label: 'GitHub',
    labelKey: 'fab.github.label',
    showLabel: true,
    to: 'https://github.com/xyz',
    toolTip: 'GitHub Repository',
    toolTipKey: 'fab.github.tooltip',
  },

  {
    color: 'info',
    label: 'Quay',
    labelKey: 'fab.quay.label',
    to: 'https://quay.io',
    toolTip: 'Quay Container Registry',
    toolTipKey: 'fab.quay.tooltip',
    icon: '<svg viewBox="0 0 250 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M200.134 0l55.555 117.514-55.555 117.518h-47.295l55.555-117.518L152.84 0h47.295zM110.08 99.836l20.056-38.092-2.29-8.868L102.847 0H55.552l48.647 102.898 5.881-3.062zm17.766 74.433l-17.333-39.034-6.314-3.101-48.647 102.898h47.295l25-52.88v-7.883z" fill="#40B4E5"/><path d="M152.842 235.032L97.287 117.514 152.842 0h47.295l-55.555 117.514 55.555 117.518h-47.295zm-97.287 0L0 117.514 55.555 0h47.296L47.295 117.514l55.556 117.518H55.555z" fill="#003764"/></svg>',
  },
  {
    color: 'success',
    label: 'Docs',
    labelKey: 'fab.docs.label',
    to: '/docs',
    toolTip: 'Documentation',
    toolTipKey: 'fab.docs.tooltip',
  },
  {
    slot: Slot.BOTTOM_LEFT,
    color: 'success',
    icon: <AddIcon />,
    label: 'Add',
    toolTip: 'Add',
    to: '/test-global-floating-action',
    priority: 100,
  },
  {
    slot: Slot.BOTTOM_LEFT,
    color: 'success',
    label: 'Github',
    icon: <GitHubIcon />,
    toolTip: 'Github',
    to: 'https://github.com/xyz',
    priority: 200,
    visibleOnPaths: ['/test-global-floating-action'],
  },
  {
    color: 'success',
    icon: <MenuIcon />,
    label: 'Menu',
    toolTip: 'Menu',
    to: 'https://github.com/xyz',
    priority: 200,
    excludeOnPaths: ['/test-global-floating-action'],
  },
];

const createPage = ({
  navTitle,
  path,
  component,
}: {
  navTitle: string;
  component: ReactElement;
  pageTitle: string;
  path: string;
}): DevAppPageOptions => {
  const scalprumState: ScalprumState = {
    initialized: true,
    api: {
      dynamicRootConfig: {
        mountPoints: {
          'global.floatingactionbutton/config': [
            {
              staticJSXContent: null,
              config: {
                color: 'success',
                icon: 'github',
                label: 'DP: GitHub',
                labelKey: 'fab.github.label',
                showLabel: true,
                to: 'https://github.com/xyz',
                toolTip: 'GitHub Repository',
                toolTipKey: 'fab.github.tooltip',
              },
            },
            {
              staticJSXContent: null,
              config: {
                color: 'info',
                label: 'Quay',
                labelKey: 'fab.quay.label',
                to: 'https://quay.io',
                toolTip: 'Quay Container Registry',
                toolTipKey: 'fab.quay.tooltip',
                icon: '<svg viewBox="0 0 250 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M200.134 0l55.555 117.514-55.555 117.518h-47.295l55.555-117.518L152.84 0h47.295zM110.08 99.836l20.056-38.092-2.29-8.868L102.847 0H55.552l48.647 102.898 5.881-3.062zm17.766 74.433l-17.333-39.034-6.314-3.101-48.647 102.898h47.295l25-52.88v-7.883z" fill="#40B4E5"/><path d="M152.842 235.032L97.287 117.514 152.842 0h47.295l-55.555 117.514 55.555 117.518h-47.295zm-97.287 0L0 117.514 55.555 0h47.296L47.295 117.514l55.556 117.518H55.555z" fill="#003764"/></svg>',
              },
            },
            {
              staticJSXContent: null,
              config: {
                slot: 'bottom-left',
                color: 'success',
                label: 'Github',
                labelKey: 'fab.github.label',
                icon: 'github',
                toolTip: 'Github',
                toolTipKey: 'fab.github.tooltip',
                to: 'https://github.com/xyz',
                priority: 200,
                visibleOnPaths: ['/test-global-floating-action-3'],
              },
            },
          ],
        },
      },
    },
    config: {},
    pluginStore: new PluginStore(),
  };

  const pageContent = (
    <ScalprumContext.Provider value={scalprumState}>
      <DynamicGlobalFloatingActionButton />
      {component}
    </ScalprumContext.Provider>
  );

  return {
    element: pageContent,
    title: navTitle,
    path,
  };
};

createDevApp()
  .registerPlugin(globalFloatingActionButtonPlugin)
  .addTranslationResource(globalFloatingActionButtonTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addPage({
    element: <ExampleComponent floatingButtons={mockFloatingButtons} />,
    title: 'Page 1',
    path: '/test-global-floating-action',
  })
  .addPage({
    element: <ExampleComponent floatingButtons={mockFloatingButtons} />,
    title: 'Page 2',
    path: '/test-global-floating-action-2',
  })
  .addPage(
    createPage({
      navTitle: 'Page 3',
      pageTitle: 'Page 3',
      path: '/test-global-floating-action-3',
      component: <ExampleComponent />,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Page 4',
      pageTitle: 'Page 4',
      path: '/test-global-floating-action-4',
      component: <ExampleComponent />,
    }),
  )
  .render();
