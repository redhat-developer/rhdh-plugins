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

export const DebugHomepageSavedWidgets = () => {
  const savedWidgetString = localStorage.getItem('/home.customHomepage/home');
  const savedWidgets = savedWidgetString
    ? JSON.parse(JSON.parse(savedWidgetString))
    : [];

  return (
    <Page themeId="home">
      <Header
        title="Homepage Saved Widgets (local storage)"
        subtitle="List of all saved widgets for the Customizable page"
      />
      <Content>
        <CodeSnippet
          language="yaml"
          text={stringify(savedWidgets)}
          showCopyCodeButton
        />
      </Content>
    </Page>
  );
};
