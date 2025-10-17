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
import { packageRouteRef, packagesRouteRef } from '../routes';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { usePackage } from '../hooks/usePackage';
import { MarketplacePackageContent } from '../components/MarketplacePackageContent';

const PackageHeader = () => {
  const params = useRouteRefParams(packageRouteRef);
  const pkg = usePackage(params.namespace, params.name);

  const displayName = pkg.data?.metadata.title ?? params.name;
  const packagesLink = useRouteRef(packagesRouteRef)();

  return <Header title={displayName} type="Packages" typeLink={packagesLink} />;
};

export const MarketplacePackagePage = () => (
  <ReactQueryProvider>
    <Page themeId={themeId}>
      <PackageHeader />
      <Content>
        <ErrorBoundary>
          <MarketplacePackageContent />
        </ErrorBoundary>
      </Content>
    </Page>
  </ReactQueryProvider>
);
