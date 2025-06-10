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

import { Page, Header, TabbedLayout } from '@backstage/core-components';
import { UserSettingsThemeToggle } from '@backstage/plugin-user-settings';

import { FormComponents } from './FormComponents';
import { PaperExamples } from './PaperExamples';
import { TabExamples } from './TabExamples';
import { GridExamples } from './GridExamples';
import { InlineStyles } from './InlineStyles';

export const MUI5TestPage = () => {
  return (
    <Page themeId="tool">
      <Header title="MUI v5 Test Page">
        <UserSettingsThemeToggle />
      </Header>
      <TabbedLayout>
        <TabbedLayout.Route path="/form-components" title="Form components">
          <FormComponents />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/papers" title="Papers">
          <PaperExamples />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/tabs" title="Tabs">
          <TabExamples />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/grids" title="Grids">
          <GridExamples />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/inline-styles" title="Inline styles">
          <InlineStyles />
        </TabbedLayout.Route>
      </TabbedLayout>
    </Page>
  );
};
