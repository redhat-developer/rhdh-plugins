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

import { ErrorPage } from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import { useSearchParams } from 'react-router-dom';

import { packageRouteRef } from '../routes';
import { usePackage } from '../hooks/usePackage';
import {
  MarketplacePluginContent,
  MarketplacePluginContentSkeleton,
} from './MarketplacePluginContent';
import { useTranslation } from '../hooks/useTranslation';

export const MarketplacePackageContent = () => {
  const { t } = useTranslation();

  const params = useRouteRefParams(packageRouteRef);
  const [searchParams] = useSearchParams();
  const qp = searchParams.get('package');
  const qpNs = qp?.split('/')[0];
  const qpName = qp?.split('/')[1];
  const namespace = qpNs || params.namespace;
  const name = qpName || params.name;
  const pkg = usePackage(namespace, name);

  if (pkg.isLoading) {
    return <MarketplacePluginContentSkeleton />;
  } else if (pkg.data) {
    return <MarketplacePluginContent plugin={pkg.data} />;
  } else if (pkg.error) {
    return <ErrorPage statusMessage={pkg.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={t('package.notFound', {
        namespace,
        name,
      } as any)}
    />
  );
};
