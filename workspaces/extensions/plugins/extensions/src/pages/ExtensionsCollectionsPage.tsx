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

import {
  Page,
  Header,
  Content,
  ErrorBoundary,
} from '@backstage/core-components';

import { themeId } from '../consts';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { ExtensionsCollectionsGrid } from '../components/ExtensionsCollectionsGrid';
import { useTranslation } from '../hooks/useTranslation';

export const ExtensionsCollectionsPage = () => {
  const { t } = useTranslation();

  return (
    <ReactQueryProvider>
      <Page themeId={themeId}>
        <Header title={t('header.collectionsPage')} />
        <Content>
          <ErrorBoundary>
            <ExtensionsCollectionsGrid />
          </ErrorBoundary>
        </Content>
      </Page>
    </ReactQueryProvider>
  );
};
