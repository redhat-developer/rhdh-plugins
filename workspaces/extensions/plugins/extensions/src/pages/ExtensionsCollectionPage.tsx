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
import { collectionRouteRef, collectionsRouteRef } from '../routes';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { useCollection } from '../hooks/useCollection';
import { useTranslation } from '../hooks/useTranslation';
import { getTranslatedText } from '../translations/utils';
import { ExtensionsCollectionGridLoader } from '../components/ExtensionsCollectionGrid';

const CollectionHeader = () => {
  const { t } = useTranslation();
  const params = useRouteRefParams(collectionRouteRef);
  const collection = useCollection(params.namespace, params.name);

  const displayName = getTranslatedText(
    collection.data?.metadata.title ?? params.name,
    (collection.data?.metadata as any)?.titleKey,
    t,
  );
  const collectionsLink = useRouteRef(collectionsRouteRef)();

  return (
    <Header title={displayName} type="Collections" typeLink={collectionsLink} />
  );
};

export const ExtensionsCollectionPage = () => (
  <ReactQueryProvider>
    <Page themeId={themeId}>
      <CollectionHeader />
      <Content>
        <ErrorBoundary>
          <ExtensionsCollectionGridLoader />
        </ErrorBoundary>
      </Content>
    </Page>
  </ReactQueryProvider>
);
