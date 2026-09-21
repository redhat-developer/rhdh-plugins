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

import { useRouteRef, useTranslationRef } from '@backstage/frontend-plugin-api';
import { SidebarItem } from '@backstage/core-components';
import SchoolIcon from '@mui/icons-material/School';

import { learningPathsRouteRef } from '../routes';
import { appDefaultsTranslationRef } from '../../translations/ref';

/**
 * Sidebar item for the Learning Paths page. Renders a Backstage `SidebarItem`
 * with a localized title from the app-defaults translations and links to the
 * page via its route ref. Rendered only when the route is available.
 *
 * @internal
 */
export function LearningPathsSidebarItem() {
  const { t } = useTranslationRef(appDefaultsTranslationRef);
  const routeLink = useRouteRef(learningPathsRouteRef);
  if (!routeLink) {
    return null;
  }
  return (
    <SidebarItem
      icon={SchoolIcon}
      text={t('menuItem.learningPaths')}
      to={routeLink()}
    />
  );
}
