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
import { Layout, Layouts } from 'react-grid-layout';

export const getDismissedEntityIllustrationUsers = () => {
  const dismissedEntityIllustrationUsers = localStorage.getItem(
    'homepage/dismissedEntityIllustrationUsers',
  );
  return dismissedEntityIllustrationUsers
    ? JSON.parse(dismissedEntityIllustrationUsers)
    : [];
};

export const addDismissedEntityIllustrationUsers = (username: string) => {
  const dismissedEntityIllustrationUsers =
    getDismissedEntityIllustrationUsers();
  if (!dismissedEntityIllustrationUsers.includes(username)) {
    dismissedEntityIllustrationUsers.push(username);
    localStorage.setItem(
      'homepage/dismissedEntityIllustrationUsers',
      JSON.stringify(dismissedEntityIllustrationUsers),
    );
  }
};

export const hasEntityIllustrationUserDismissed = (username: string) => {
  const dismissedEntityIllustrationUsers =
    getDismissedEntityIllustrationUsers();
  return dismissedEntityIllustrationUsers.includes(username);
};

export const generateOnboardingLayouts = (items: string[]): Layouts => {
  const breakpoints = ['xl', 'lg', 'md', 'sm', 'xs', 'xxs'];
  const layouts: Layouts = {};

  breakpoints.forEach(breakpoint => {
    const layout: Layout[] = [];

    items.forEach((itemKey, index) => {
      let x = 0;
      let y = 0;
      let width = 3;
      const height = 1.5;

      switch (breakpoint) {
        case 'xl':
        case 'lg':
        case 'md':
          x = index * 3;
          y = 0;
          break;

        case 'sm':
          width = 6;
          x = (index % 2) * 6;
          y = Math.floor(index / 2);
          break;

        case 'xs':
        case 'xxs':
          width = 12;
          x = 0;
          y = index;
          break;

        default:
          x = 0;
          y = index;
          width = 12;
      }

      layout.push({
        i: itemKey,
        x,
        y,
        w: width,
        h: height,
      });
    });

    layouts[breakpoint] = layout;
  });

  return layouts;
};

interface GenerateTemplateSectionLayoutsOptions {
  breakpoints: Record<string, number>;
  templates: any[];
  templateKeys: string[];
}

export const generateTemplateSectionLayouts = ({
  breakpoints,
  templates,
  templateKeys,
}: GenerateTemplateSectionLayoutsOptions): Layouts => {
  const layouts: Layouts = {};

  Object.keys(breakpoints).forEach(breakpoint => {
    const layout: Layout[] = templateKeys.map((templateKey, index) => {
      let x = 0;
      let y = 0;
      let w = 3;
      const h = 1.5;

      if (['xl', 'lg', 'md'].includes(breakpoint)) {
        x = index * 3;
        y = 0;
        w = 3;
      } else if (breakpoint === 'sm') {
        x = (index % 2) * 6;
        y = Math.floor(index / 2);
        w = 6;
      } else if (['xs', 'xxs'].includes(breakpoint)) {
        x = 0;
        y = index * 2;
        w = 12;
      }

      return { i: templateKey, x, y, w, h };
    });

    // Add empty state if no templates
    if (templates.length === 0) {
      layout.push({
        i: 'empty',
        x: 0,
        y: 0,
        w: 12,
        h: 1.5,
      });
    }

    layouts[breakpoint] = layout;
  });

  return layouts;
};
