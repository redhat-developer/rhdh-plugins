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

import { Container, HeaderPage, TabPanel, Tabs } from '@backstage/ui';

import { useLocation } from 'react-router';

import { UserSettingsThemeToggle } from '@backstage/plugin-user-settings';

import { FormComponents } from './FormComponents';
import { TableExample } from './TableExample';
import { CardsExample } from './CardExample';

export const BUITestPage = () => {
  const { pathname } = useLocation();

  return (
    <>
      <HeaderPage
        title="Backstage UI Tests"
        customActions={<UserSettingsThemeToggle />}
        tabs={[
          {
            id: 'form-components',
            label: 'Form Components',
            href: '.',
          },
          {
            id: 'table-example',
            label: 'Table Example',
            href: 'table-example',
          },
          {
            id: 'card-example',
            label: 'Card Example',
            href: 'card-example',
          },
        ]}
      />
      <Container>
        <Tabs selectedKey={pathname.split('/')[2] ?? 'form-components'}>
          <TabPanel id="form-components">
            <FormComponents />
          </TabPanel>
          <TabPanel id="table-example">
            <TableExample />
          </TabPanel>
          <TabPanel id="card-example">
            <CardsExample />
          </TabPanel>
        </Tabs>
      </Container>
    </>
  );
};
