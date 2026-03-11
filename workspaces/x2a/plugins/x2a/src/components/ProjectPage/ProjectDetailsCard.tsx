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

import { InfoCard } from '@backstage/core-components';
import { Grid, GridProps } from '@material-ui/core';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { ItemField } from '../ItemField';
import { useTranslation } from '../../hooks/useTranslation';
import { ArtifactLink } from '../Artifacts';
import { ProjectStatusCell } from '../ProjectStatusCell';
import { Repository } from '../Repository';

const gridItemProps: GridProps = {
  xs: 6,
  item: true,
};

export const ProjectDetailsCard = ({ project }: { project: Project }) => {
  const { t } = useTranslation();
  const empty = t('empty');

  return (
    <InfoCard title={t('projectDetailsCard.title')} variant="gridItem">
      <Grid container direction="row" spacing={3}>
        <Grid {...gridItemProps}>
          <ItemField
            label={t('projectDetailsCard.name')}
            value={project.name || empty}
          />
        </Grid>

        <Grid {...gridItemProps}>
          <ItemField
            label={t('projectDetailsCard.status')}
            value={<ProjectStatusCell projectStatus={project.status} />}
          />
        </Grid>

        <Grid {...gridItemProps}>
          <ItemField
            label={t('projectDetailsCard.abbreviation')}
            value={project.abbreviation || empty}
          />
        </Grid>

        <Grid {...gridItemProps}>
          <ItemField
            label={t('projectDetailsCard.createdBy')}
            value={project.createdBy || empty}
          />
        </Grid>

        <Grid {...gridItemProps}>
          <ItemField
            label={t('projectDetailsCard.sourceRepo')}
            value={
              <Repository
                url={project.sourceRepoUrl}
                branch={project.sourceRepoBranch}
              />
            }
          />
        </Grid>

        <Grid {...gridItemProps}>
          <ItemField
            label={t('projectDetailsCard.targetRepo')}
            value={
              <Repository
                url={project.targetRepoUrl}
                branch={project.targetRepoBranch}
              />
            }
          />
        </Grid>

        <Grid {...gridItemProps} xs={4}>
          <ItemField
            label={t('artifact.types.migration_plan')}
            value={
              project.migrationPlan ? (
                <ArtifactLink
                  artifact={project.migrationPlan}
                  targetRepoUrl={project.targetRepoUrl}
                  targetRepoBranch={project.targetRepoBranch}
                />
              ) : (
                t('empty')
              )
            }
          />
        </Grid>

        <Grid {...gridItemProps} xs={12}>
          <ItemField
            label={t('projectDetailsCard.description')}
            value={project.description || empty}
          />
        </Grid>
      </Grid>
    </InfoCard>
  );
};
