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

import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import {
  Page,
  Header,
  Content,
  ErrorBoundary,
} from '@backstage/core-components';

import { themeId } from '../consts';
import { pluginRouteRef, pluginsRouteRef } from '../routes';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { ExtensionsPluginContentLoader } from '../components/ExtensionsPluginContent';
import { usePlugin } from '../hooks/usePlugin';

const PluginHeader = () => {
  const params = useRouteRefParams(pluginRouteRef);
  const plugin = usePlugin(params.namespace, params.name);

  const displayName = plugin.data?.metadata.title ?? params.name;
  const pluginsLink = useRouteRef(pluginsRouteRef)();

  return <Header title={displayName} type="Plugins" typeLink={pluginsLink} />;
};

export const ExtensionsPluginPage = () => (
  <ReactQueryProvider>
    <Page themeId={themeId}>
      <PluginHeader />
      <Content>
        <ErrorBoundary>
          <ExtensionsPluginContentLoader />
        </ErrorBoundary>
      </Content>
    </Page>
  </ReactQueryProvider>
);
