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

import { useApi } from '@backstage/core-plugin-api';
import {
  CodeSnippet,
  Content,
  Header,
  Page,
  Progress,
  WarningPanel,
} from '@backstage/core-components';

import useAsync from 'react-use/lib/useAsync';
import { stringify } from 'yaml';

import { defaultWidgetsApiRef } from '@red-hat-developer-hub/backstage-plugin-dynamic-home-page';

export const DebugHomepageDefaultWidgets = () => {
  const defaultWidgetsApi = useApi(defaultWidgetsApiRef);

  const { value, loading, error } = useAsync(
    () => defaultWidgetsApi.getDefaultWidgets(),
    [defaultWidgetsApi],
  );

  return (
    <Page themeId="home">
      <Header
        title="Homepage Default Widgets (API)"
        subtitle="List of all default widgets returned from the backend and filtered by permissions."
      />
      <Content>
        {loading && <Progress />}
        {error && (
          <WarningPanel title="Failed to load default widgets">
            <CodeSnippet language="text" text={error.toString()} />
          </WarningPanel>
        )}
        {value && (
          <CodeSnippet
            language="yaml"
            text={stringify(value)}
            showCopyCodeButton
          />
        )}
      </Content>
    </Page>
  );
};
