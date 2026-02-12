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

import { Card, CardBody, CardHeader } from '@backstage/ui';
import {
  Artifact,
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Grid } from '@material-ui/core';

import { useTranslation } from '../../hooks/useTranslation';
import { ItemField } from '../ItemField';
import { Link } from '@backstage/core-components';
import { buildArtifactUrl, humanizeArtifactType } from '../tools';

const ArtifactLink = ({ artifact }: { artifact?: Artifact }) => {
  const { t } = useTranslation();
  if (!artifact) {
    return t('module.phases.none');
  }
  return (
    <Link
      to={buildArtifactUrl(artifact.value, '')}
      target="_blank"
      rel="noopener noreferrer"
      key={artifact.id}
    >
      {humanizeArtifactType(t, artifact.type)}
    </Link>
  );
};

export const ArtifactsCard = ({ module }: { module?: Module }) => {
  const { t } = useTranslation();

  const migrationPlanArtifact = undefined; // TODO: from project
  const moduleMigrationPlanArtifact = module?.analyze?.artifacts?.find(
    artifact => artifact.type === 'module_migration_plan',
  );
  const migratedSourcesArtifact = module?.migrate?.artifacts?.find(
    artifact => artifact.type === 'migrated_sources',
  );

  return (
    <Card>
      <CardHeader>{t('modulePage.artifacts.title')}</CardHeader>
      <CardBody>
        <Grid container direction="row" spacing={3}>
          <Grid item xs={4}>
            <ItemField
              label={t('modulePage.artifacts.migration_plan')}
              value={<ArtifactLink artifact={migrationPlanArtifact} />}
            />
          </Grid>
          <Grid item xs={4}>
            <ItemField
              label={t('modulePage.artifacts.module_migration_plan')}
              value={<ArtifactLink artifact={moduleMigrationPlanArtifact} />}
            />
          </Grid>
          <Grid item xs={4}>
            <ItemField
              label={t('modulePage.artifacts.migrated_sources')}
              value={<ArtifactLink artifact={migratedSourcesArtifact} />}
            />
          </Grid>
          <Grid item xs={12}>
            {t('modulePage.artifacts.description')}
          </Grid>
        </Grid>
      </CardBody>
    </Card>
  );
};
