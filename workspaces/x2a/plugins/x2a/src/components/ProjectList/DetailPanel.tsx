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
import { useEffect } from 'react';
import { Grid, GridProps, makeStyles, Typography } from '@material-ui/core';
import {
  Project,
  Module,
  POLLING_INTERVAL_MS,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import { useClientService } from '../../ClientService';
import { usePolledFetch } from '../../hooks/usePolledFetch';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { ModuleTable } from '../ModuleTable';
import { ItemField } from '../ItemField';
import { ArtifactLink } from '../Artifacts';

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

// Limit the size of cache to avoid memory leaks. No-hit is not an issue - the DetailPanel just quickly shows the loading state.
const MAX_CACHE_SIZE = 1000;
// Prevents stale data on row expansion but still prevents flickering of the loading state for a quick collapse/expand.
const CACHE_TTL_MS = 3 * POLLING_INTERVAL_MS;

interface CacheEntry {
  data: Module[];
  timestamp: number;
}

const modulesCache = new Map<string, CacheEntry>();

function getCache(key: string): Module[] | undefined {
  const entry = modulesCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    modulesCache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCache(key: string, value: Module[]): void {
  modulesCache.delete(key);
  if (modulesCache.size >= MAX_CACHE_SIZE) {
    const oldest = modulesCache.keys().next().value;
    if (oldest !== undefined) modulesCache.delete(oldest);
  }
  modulesCache.set(key, { data: value, timestamp: Date.now() });
}

/** Exposed for tests only. */
export function clearModulesCache(): void {
  modulesCache.clear();
}

export const DetailPanel = ({
  project,
  forceRefresh,
}: {
  project: Project;
  forceRefresh: () => void;
}) => {
  const { t } = useTranslation();
  const styles = useStyles();
  const clientService = useClientService();

  const cached = getCache(project.id);

  const {
    data: value,
    loading,
    error,
  } = usePolledFetch(
    async () => {
      const response = await clientService.projectsProjectIdModulesGet({
        path: { projectId: project.id },
      });
      return (await response.json()) as Module[];
    },
    [project.id, clientService],
    { initialData: cached },
  );

  useEffect(() => {
    if (value) {
      setCache(project.id, value);
    }
  }, [project.id, value]);

  return (
    <Grid container spacing={3} direction="row" className={styles.detailPanel}>
      {error && (
        <Grid {...gridItemProps} xs={12}>
          <ResponseErrorPanel error={error} />
        </Grid>
      )}

      <Grid {...gridItemProps} xs={2}>
        <ItemField
          label={t('project.abbreviation')}
          value={project.abbreviation}
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

      {loading && <Progress />}

      {value && value.length > 0 && (
        <Grid {...gridItemProps} xs={12}>
          <ModuleTable
            modules={value}
            forceRefresh={forceRefresh}
            project={project}
          />
        </Grid>
      )}
      {!(value && value.length > 0) && (
        <Grid {...gridItemProps} xs={12}>
          <Typography variant="body1" align="center">
            {t('project.noModules')}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};
