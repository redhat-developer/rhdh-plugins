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

import React from 'react';

import { ErrorPage, Progress } from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';

import { MarketplacePackage } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { packageInstallRouteRef } from '../routes';
import { usePackage } from '../hooks/usePackage';

export const MarketplacePackageInstallContent = ({
  pkg,
}: {
  pkg: MarketplacePackage;
}) => {
  return (
    <div>
      <h2>Not implemented yet</h2>
      <div>Package entity:</div>
      <pre>{JSON.stringify(pkg, null, 2)}</pre>
    </div>
  );
};

export const MarketplacePackageInstallContentLoader = () => {
  const params = useRouteRefParams(packageInstallRouteRef);
  const pkg = usePackage(params.namespace, params.name);

  if (pkg.isLoading) {
    return <Progress />;
  } else if (pkg.data) {
    return <MarketplacePackageInstallContent pkg={pkg.data} />;
  } else if (pkg.error) {
    return <ErrorPage statusMessage={pkg.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={`Package ${params.namespace}/${params.name} not found!`}
    />
  );
};
