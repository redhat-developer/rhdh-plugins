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

import { TableExample } from './TableExample';
import { CardsExample } from './CardExample';

export const BCCTestPage = () => {
  return (
    <Page themeId="tool">
      <Header title="Backstage Core Components Tests">
        <UserSettingsThemeToggle />
      </Header>
      <TabbedLayout>
        <TabbedLayout.Route
          path="/table-example"
          title="Table example"
          children={<TableExample />}
        />
        <TabbedLayout.Route
          path="/card-example"
          title="Card example"
          children={<CardsExample />}
        />
      </TabbedLayout>
    </Page>
  );
};
