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
import { useCallback, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { Grid, GridProps, makeStyles } from '@material-ui/core';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import { useClientService } from '../../ClientService';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { ModuleTable } from '../ModuleTable';
import { ArtifactLink } from '../ModuleTable/Artifacts';
import { ItemField } from '../ItemField';

const useStyles = makeStyles(() => ({
  detailPanel: {
    padding: '1rem',
  },
}));

const gridItemProps: GridProps = {
  xs: 4,
  item: true,
};

export const DetailPanel = ({ project }: { project: Project }) => {
  const { t } = useTranslation();
  const styles = useStyles();
  const clientService = useClientService();

  const [refresh, setRefresh] = useState(0);
  const forceRefresh = useCallback(() => {
    setRefresh(refresh + 1);
  }, [refresh]);

  const { value, loading, error } = useAsync(async () => {
    const response = await clientService.projectsProjectIdModulesGet({
      path: { projectId: project.id },
    });
    return await response.json();
  }, [project.id, refresh]);

  return (
    <Grid container spacing={3} direction="row" className={styles.detailPanel}>
      {error && (
        <Grid {...gridItemProps} xs={12}>
          <ResponseErrorPanel error={error} />
        </Grid>
      )}

      <Grid {...gridItemProps}>
        <ItemField
          label={t('project.abbreviation')}
          value={project.abbreviation}
        />
      </Grid>
      <Grid {...gridItemProps}>
        <ItemField label={t('project.id')} value={project.id} />
      </Grid>
      <Grid {...gridItemProps}>
        <ItemField label={t('project.createdBy')} value={project.createdBy} />
      </Grid>

      <Grid {...gridItemProps} xs={8}>
        <ItemField
          label={t('project.description')}
          value={project.description}
        />
      </Grid>
      {project.migrationPlan && (
        <Grid {...gridItemProps} xs={4}>
          <ItemField
            label={t('artifact.types.migration_plan')}
            value={
              <ArtifactLink
                artifact={project.migrationPlan}
                targetRepoUrl={project.targetRepoUrl}
              />
            }
          />
        </Grid>
      )}
      {/* We do not need to repeat the same fields as in the ProjectTable component */}

      {loading && <Progress />}
      {value && (
        <Grid {...gridItemProps} xs={12}>
          <ModuleTable
            modules={value}
            forceRefresh={forceRefresh}
            project={project}
          />
        </Grid>
      )}
    </Grid>
  );
};
