/*
 * Copyright The Backstage Authors
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

import React from 'react';

import { useRouteRef } from '@backstage/core-plugin-api';
import { Link } from '@backstage/core-components';

import { MarketplacePlugin } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { pluginRouteRef } from '../routes';

export const PluginLink = ({ plugin }: { plugin: MarketplacePlugin }) => {
  const getPluginPath = useRouteRef(pluginRouteRef);
  const link = getPluginPath({
    namespace: plugin.metadata.namespace!,
    name: plugin.metadata.name,
  });
  const packageName = plugin.metadata.title ?? plugin.metadata.name;
  return <Link to={link}>{packageName}</Link>;
};
