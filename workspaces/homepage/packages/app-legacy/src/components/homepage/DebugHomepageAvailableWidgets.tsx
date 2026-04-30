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

import { CodeSnippet, Content, Header, Page } from '@backstage/core-components';

import { stringify } from 'yaml';

// eslint-disable-next-line @backstage/no-relative-monorepo-imports
import { useDynamicHomePageCards } from '../../../../../plugins/dynamic-home-page/src/hooks/useDynamicHomePageCards';

export const DebugHomepageAvailableWidgets = () => {
  const mountPoints = useDynamicHomePageCards();

  const yaml = mountPoints.map(mountPoint => ({
    ...mountPoint,
    Component: undefined,
    Actions: undefined,
    Settings: undefined,
  }));

  return (
    <Page themeId="home">
      <Header
        title="Homepage Available Widgets (mount points)"
        subtitle="List of all widgets from ScalprumContext in App.tsx"
      />
      <Content>
        <CodeSnippet
          language="yaml"
          text={stringify(yaml)}
          showCopyCodeButton
        />
      </Content>
    </Page>
  );
};
