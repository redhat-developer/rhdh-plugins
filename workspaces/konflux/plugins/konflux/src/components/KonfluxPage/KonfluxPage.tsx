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

import '@patternfly/react-core/dist/styles/base-no-reset.css';
import '@patternfly/patternfly/utilities/Accessibility/accessibility.css';
import { Progress } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';

import { usePageLoading } from '../../hooks/usePageLoading';

import { ApplicationsList } from '../List/ApplicationsList/ApplicationsList';
import { ComponentsList } from '../List/ComponentsList/ComponentsList';
import { KonfluxQueryProvider } from '../../api';
import { RefreshButton } from '../RefreshButton';
import { Divider } from '@patternfly/react-core';

import './KonfluxPage.css';

/** @public */
export const KonfluxPageComponent = () => {
  const { entity } = useEntity();
  const { loading, hasSubcomponents } = usePageLoading(entity);

  if (loading) {
    return (
      <div data-testid="konflux-page-progress">
        <Progress />
      </div>
    );
  }

  return (
    <KonfluxQueryProvider>
      <RefreshButton />
      <ApplicationsList hasSubcomponents={hasSubcomponents} />
      <Divider component="div" className="divider" />
      <ComponentsList hasSubcomponents={hasSubcomponents} />
    </KonfluxQueryProvider>
  );
};
