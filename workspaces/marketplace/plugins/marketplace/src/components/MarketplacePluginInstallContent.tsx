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

import { ErrorPage, Progress } from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';

import { MarketplacePlugin } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { pluginInstallRouteRef } from '../routes';
import { usePlugin } from '../hooks/usePlugin';

export const MarketplacePluginInstallContent = ({
  plugin,
}: {
  plugin: MarketplacePlugin;
}) => {
  return (
    <div>
      <h2>Not implemented yet</h2>
      <div>Plugin entity:</div>
      <pre>{JSON.stringify(plugin, null, 2)}</pre>
    </div>
  );
};

export const MarketplacePluginInstallContentLoader = () => {
  const params = useRouteRefParams(pluginInstallRouteRef);

  const plugin = usePlugin(params.namespace, params.name);

  if (plugin.isLoading) {
    return <Progress />;
  } else if (plugin.data) {
    return <MarketplacePluginInstallContent plugin={plugin.data} />;
  } else if (plugin.error) {
    return <ErrorPage statusMessage={plugin.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={`Plugin ${params.namespace}/${params.name} not found!`}
    />
  );
};
