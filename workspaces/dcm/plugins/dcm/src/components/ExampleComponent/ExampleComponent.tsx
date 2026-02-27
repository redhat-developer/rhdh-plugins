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
import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
} from '@backstage/core-components';

export const ExampleComponent = () => (
  <Page themeId="tool">
    <Header title="Welcome to dcm!" subtitle="Optional subtitle">
      <HeaderLabel label="Team" value="DCM" />
      <HeaderLabel label="Developer" value="Red Hat Developer Hub" />
    </Header>
    <Content>
      <ContentHeader
        title="DCM"
        description="DCM is a plugin for the Red Hat Developer Hub"
      />
    </Content>
  </Page>
);
