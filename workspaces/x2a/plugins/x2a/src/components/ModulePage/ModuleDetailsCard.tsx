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

import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@material-ui/core';
import CodeIcon from '@material-ui/icons/Code';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import {
  Artifact,
  ArtifactKind,
  GitRepositoryRef,
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { InfoCard } from '@backstage/core-components';

import { useScmHostMap } from '../../hooks/useScmHostMap';
import { useTranslation } from '../../hooks/useTranslation';
import { ItemField } from '../ItemField';
import { ModuleStatusCell } from '../ModuleStatusCell';
import { ArtifactLink } from '../ArtifactLink';
import { buildCodespace } from '../tools';

export const ModuleDetailsCard = ({
  module,
  targetRepository,
  migrationPlanArtifact,
}: {
  module?: Module;
  targetRepository?: GitRepositoryRef;
  migrationPlanArtifact?: Artifact;
}) => {
  const { t } = useTranslation();
  const hostMap = useScmHostMap();
  const targetRepoUrl = targetRepository?.url ?? '';
  const targetRepoBranch = targetRepository?.branch ?? '';
  const empty = t('empty');

  const moduleMigrationPlanArtifact = module?.analyze?.artifacts?.find(
    artifact => ArtifactKind.from(artifact.type).isModuleMigrationPlan(),
  );
  const migratedSourcesArtifact = module?.migrate?.artifacts?.find(artifact =>
    ArtifactKind.from(artifact.type).isMigratedSources(),
  );
  const ansibleProjectArtifact = module?.publish?.artifacts?.find(artifact =>
    ArtifactKind.from(artifact.type).isAnsibleProject(),
  );
  const codespace = targetRepository
    ? buildCodespace(targetRepository, hostMap)
    : undefined;

  return (
    <InfoCard title={t('modulePage.title')} variant="gridItem">
      <Grid container direction="row" spacing={3}>
        <Grid item xs={12} sm={3}>
          <ItemField label={t('module.name')} value={module?.name || empty} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ItemField
            label={t('module.status')}
            value={<ModuleStatusCell module={module} />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ItemField
            label={t('module.sourcePath')}
            value={module?.sourcePath || empty}
          />
        </Grid>
        <Grid item sm={3} />

        <Grid item xs={12}>
          <Divider />
          <Box display="flex" alignItems="center" mt={2} mb={1}>
            <Typography variant="subtitle2">
              {t('modulePage.artifacts.title')}
            </Typography>
            <Tooltip title={t('modulePage.artifacts.description')}>
              <IconButton
                aria-label={t('modulePage.artifacts.description')}
                size="small"
                style={{ marginLeft: 6 }}
              >
                <InfoOutlinedIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>

        <Grid item xs={12} sm={3}>
          <ItemField
            label={t('modulePage.artifacts.migration_plan')}
            value={
              <ArtifactLink
                artifact={migrationPlanArtifact}
                targetRepoUrl={targetRepoUrl}
                targetRepoBranch={targetRepoBranch}
              />
            }
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ItemField
            label={t('modulePage.artifacts.module_migration_plan')}
            value={
              <ArtifactLink
                artifact={moduleMigrationPlanArtifact}
                targetRepoUrl={targetRepoUrl}
                targetRepoBranch={targetRepoBranch}
              />
            }
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ItemField
            label={t('modulePage.artifacts.migrated_sources')}
            value={
              <Box
                display="flex"
                alignItems="center"
                flexWrap="wrap"
                style={{ gap: 8 }}
              >
                <ArtifactLink
                  artifact={migratedSourcesArtifact}
                  targetRepoUrl={targetRepoUrl}
                  targetRepoBranch={targetRepoBranch}
                />
                {migratedSourcesArtifact && codespace && (
                  <Button
                    href={codespace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<CodeIcon />}
                  >
                    {t('modulePage.artifacts.editInCodespaces')}
                  </Button>
                )}
              </Box>
            }
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ItemField
            label={t('modulePage.artifacts.ansible_project')}
            value={
              <ArtifactLink
                artifact={ansibleProjectArtifact}
                targetRepoUrl={targetRepoUrl}
                targetRepoBranch={targetRepoBranch}
              />
            }
          />
        </Grid>
      </Grid>
    </InfoCard>
  );
};
