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

import { useRouteRefParams } from '@backstage/core-plugin-api';
import { useLocation } from 'react-router-dom';
import {
  Page,
  Header,
  Content,
  ErrorBoundary,
} from '@backstage/core-components';

import { themeId } from '../consts';
import { packageInstallRouteRef } from '../routes';
import { ReactQueryProvider } from '../components/ReactQueryProvider';
import { usePackage } from '../hooks/usePackage';
import { MarketplacePackageEditContentLoader } from '../components/MarketplacePackageEditContent';

const PackageEditHeader = () => {
  const params = useRouteRefParams(packageInstallRouteRef);
  const location = useLocation();

  const pkg = usePackage(params.namespace, params.name);

  const displayName = pkg.data?.metadata.title ?? params.name;
  const title = `Edit ${displayName}`;
  const baseLink = '/extensions/installed-packages';
  const preserved = new URLSearchParams(location.search);
  const packageLink = preserved.size ? `${baseLink}?${preserved}` : baseLink;

  return <Header title={title} type="Packages" typeLink={packageLink} />;
};

export const MarketplacePackageInstallPage = () => {
  return (
    <ReactQueryProvider>
      <Page themeId={themeId}>
        <PackageEditHeader />
        <Content>
          <ErrorBoundary>
            {/* Force remount on navigation within same route to reseed editor */}
            <MarketplacePackageEditContentLoader />
          </ErrorBoundary>
        </Content>
      </Page>
    </ReactQueryProvider>
  );
};
