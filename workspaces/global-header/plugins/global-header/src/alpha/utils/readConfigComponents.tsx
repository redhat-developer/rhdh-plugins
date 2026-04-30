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

import type { Config } from '@backstage/config';

import { HeaderIconButton } from '../../components/HeaderIconButton/HeaderIconButton';
import type { GlobalHeaderComponentData } from '../types';

/**
 * Reads `globalHeader.components` from the app config and maps
 * each entry into a {@link GlobalHeaderComponentData}.
 *
 * Config-driven components are always rendered as a `HeaderIconButton`
 * (icon + link), matching the data-driven tier of
 * `GlobalHeaderComponentBlueprint`.
 */
export function readConfigComponents(
  configApi: Config,
): GlobalHeaderComponentData[] {
  const items = configApi.getOptionalConfigArray('globalHeader.components');
  if (!items) return [];

  return items.map(item => {
    const title = item.getString('title');
    const titleKey = item.getOptionalString('titleKey');
    const icon = item.getString('icon');
    const link = item.getString('link');
    const tooltip = item.getOptionalString('tooltip');
    const priority = item.getOptionalNumber('priority');

    const ConfigComponent = () => (
      <HeaderIconButton
        title={title}
        titleKey={titleKey}
        icon={icon}
        tooltip={tooltip}
        to={link}
      />
    );

    return { component: ConfigComponent, priority };
  });
}
