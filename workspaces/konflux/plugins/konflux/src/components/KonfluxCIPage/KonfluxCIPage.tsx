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

import { Progress } from '@backstage/core-components';
import { useEntitySubcomponents } from '../../hooks/useEntitySubcomponents';
import { useEntity } from '@backstage/plugin-catalog-react';
import { PipelineRunsList } from '../List/PipelineRunsList/PipelineRunsList';
import { CommitsList } from '../List/CommitsList';
import { KonfluxQueryProvider } from '../../api';
import { RefreshButton } from '../RefreshButton';

import './KonfluxCIPage.css';
import { Divider } from '@patternfly/react-core';

export const KonfluxCIPageComponent = () => {
  const { entity } = useEntity();
  const { subcomponentEntities, loading } = useEntitySubcomponents(entity);

  if (loading) {
    return (
      <div data-testid="konflux-ci-page-progress">
        <Progress />
      </div>
    );
  }

  return (
    <KonfluxQueryProvider>
      <RefreshButton />
      <PipelineRunsList
        hasSubcomponents={(subcomponentEntities?.length || 0) > 1}
      />
      <Divider className="divider" />
      <CommitsList hasSubcomponents={(subcomponentEntities?.length || 0) > 1} />
    </KonfluxQueryProvider>
  );
};
