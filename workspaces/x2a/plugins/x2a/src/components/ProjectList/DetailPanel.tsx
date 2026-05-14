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
import { Grid, GridProps, makeStyles, Typography } from '@material-ui/core';
import {
  Project,
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import { useScmHostMap } from '../../hooks/useScmHostMap';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { ModuleTable } from '../ModuleTable';
import { ItemField } from '../ItemField';
import { ArtifactLink } from '../Artifacts';
import { ExternalLink } from '../ExternalLink';
import { buildProjectDirUrl } from '../tools';

const useStyles = makeStyles(() => ({
  detailPanel: {
    padding: '1rem',
  },
  alignRight: {
    textAlign: 'right',
  },
}));

const gridItemProps: GridProps = {
  xs: 4,
  item: true,
};

export interface DetailPanelProps {
  project: Project;
  forceRefresh: () => void;
  modules?: Module[];
  modulesLoading?: boolean;
  modulesError?: Error;
}

export const DetailPanel = ({
  project,
  forceRefresh,
  modules,
  modulesLoading,
  modulesError,
}: DetailPanelProps) => {
  const { t } = useTranslation();
  const styles = useStyles();
  const hostMap = useScmHostMap();

  return (
    <Grid container spacing={3} direction="row" className={styles.detailPanel}>
      {modulesError && (
        <Grid {...gridItemProps} xs={12}>
          <ResponseErrorPanel error={modulesError} />
        </Grid>
      )}

      <Grid {...gridItemProps} xs={2}>
        <ItemField
          label={t('project.dirName')}
          value={
            project.dirName ? (
              <ExternalLink to={buildProjectDirUrl(project, hostMap)!}>
                {project.dirName}
              </ExternalLink>
            ) : undefined
          }
        />
      </Grid>

      <Grid {...gridItemProps} xs={6}>
        <ItemField
          label={t('project.description')}
          value={project.description}
        />
      </Grid>
      {project.migrationPlan && (
        <Grid {...gridItemProps} xs={4} className={styles.alignRight}>
          <ItemField
            label={t('artifact.types.migration_plan')}
            value={
              <ArtifactLink
                artifact={project.migrationPlan}
                targetRepoUrl={project.targetRepoUrl}
                targetRepoBranch={project.targetRepoBranch}
              />
            }
          />
        </Grid>
      )}
      {/* We do not need to repeat the same fields as in the ProjectTable component */}

      {modulesLoading && <Progress />}

      {modules && modules.length > 0 && (
        <Grid {...gridItemProps} xs={12}>
          <ModuleTable
            modules={modules}
            forceRefresh={forceRefresh}
            project={project}
          />
        </Grid>
      )}
      {!(modules && modules.length > 0) && !modulesLoading && (
        <Grid {...gridItemProps} xs={12}>
          <Typography variant="body1" align="center">
            {t('project.noModules')}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};
