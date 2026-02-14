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
import { useCallback, useMemo, useState } from 'react';
import {
  Artifact,
  MigrationPhase,
  Module,
  ModulePhase,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Link, Table, TableColumn } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { MaterialTableProps } from '@material-table/core/types';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import { useTranslation } from '../../hooks/useTranslation';
import { useClientService } from '../../ClientService';
import { Artifacts } from './Artifacts';
import { humanizeDate } from '../tools';
import { getAuthTokenDescriptor, useRepoAuthentication } from '../../repoAuth';
import { ModuleStatusCell } from './ModuleStatusCell';
import { moduleRouteRef } from '../../routes';

const getLastJob = (rowData: Module) => {
  const phases: ('publish' | 'migrate' | 'analyze')[] = [
    'publish',
    'migrate',
    'analyze',
  ];
  for (const phase of phases) {
    if (rowData[phase]?.phase) {
      return rowData[phase];
    }
  }
  return undefined;
};

export const getNextPhase = (module: Module): ModulePhase | undefined => {
  const lastJob = getLastJob(module);
  const lastPhase: MigrationPhase = lastJob?.phase || 'init';

  const nextPhases: Record<MigrationPhase, ModulePhase | undefined> = {
    init: 'analyze',
    analyze: 'migrate',
    migrate: 'publish',
    publish: undefined,
  };
  return nextPhases[lastPhase];
};

const useColumns = ({
  targetRepoUrl,
}: {
  targetRepoUrl: string;
}): TableColumn<Module>[] => {
  const { t } = useTranslation();
  const modulePath = useRouteRef(moduleRouteRef);

  const lastPhaseCell = useCallback(
    (rowData: Module) => {
      const lastPhase = getLastJob(rowData)?.phase || 'none';
      return <div>{t(`module.phases.${lastPhase}`)}</div>;
    },
    [t],
  );

  // List the artifacts for the last phase
  const artifactsCell = useCallback(
    (module: Module) => {
      const artifacts: Artifact[] = [];
      artifacts.push(...(module.analyze?.artifacts || []));
      artifacts.push(...(module.migrate?.artifacts || []));
      artifacts.push(...(module.publish?.artifacts || []));
      return <Artifacts artifacts={artifacts} targetRepoUrl={targetRepoUrl} />;
    },
    [targetRepoUrl],
  );

  const startedAtCell = useCallback(
    (rowData: Module) => {
      const lastJob = getLastJob(rowData);
      if (!lastJob) {
        return <div>{t('module.phases.none')}</div>;
      }
      const formatted = humanizeDate(lastJob.startedAt);
      return <div>{formatted}</div>;
    },
    [t],
  );
  const finishedAtCell = useCallback(
    (rowData: Module) => {
      const lastJob = getLastJob(rowData);
      if (!lastJob?.finishedAt) {
        return <div>{t('module.phases.none')}</div>;
      }
      const formatted = humanizeDate(lastJob.finishedAt);
      return <div>{formatted}</div>;
    },
    [t],
  );

  const nameCell = useCallback(
    (rowData: Module) => {
      return (
        <Link
          to={modulePath({
            projectId: rowData.projectId,
            moduleId: rowData.id,
          })}
        >
          {rowData.name}
        </Link>
      );
    },
    [modulePath],
  );

  return useMemo((): TableColumn<Module>[] => {
    return [
      { render: nameCell, title: t('module.name') },
      {
        field: 'status',
        render: (rowData: Module) => (
          <ModuleStatusCell
            status={rowData.status}
            errorDetails={rowData.errorDetails}
          />
        ),
        title: t('module.status'),
      },
      { field: 'sourcePath', title: t('module.sourcePath') },
      { render: lastPhaseCell, title: t('module.lastPhase') },
      { render: artifactsCell, title: t('module.artifacts') },
      { render: startedAtCell, title: t('module.startedAt') },
      { render: finishedAtCell, title: t('module.finishedAt') },
    ];
  }, [
    t,
    lastPhaseCell,
    artifactsCell,
    startedAtCell,
    finishedAtCell,
    nameCell,
  ]);
};

const canRunNextPhase = ({ module }: { module: Module }) => {
  const nextPhase = getNextPhase(module);
  if (!nextPhase) {
    return false;
  }

  // TODO: Consider check whether we have all artifacts instead of just checking the last job status
  const lastJob = getLastJob(module);
  if (!lastJob || lastJob.status === 'success') {
    return true;
  }

  return false;
};

export const ModuleTable = ({
  modules,
  forceRefresh,
  project,
}: {
  modules: Module[];
  forceRefresh: () => void;
  project: Project;
}) => {
  const { t } = useTranslation();
  const repoAuthentication = useRepoAuthentication();

  const columns = useColumns({ targetRepoUrl: project.targetRepoUrl });
  const data: Module[] = modules;
  const clientService = useClientService();

  const [error, setError] = useState<string | undefined>();

  const handleRunNext = useCallback(
    async (module: Module) => {
      setError(undefined);
      const nextPhase = getNextPhase(module);
      if (!nextPhase) {
        return;
      }

      // Authenticate the repositories
      const sourceRepoAuthToken = (
        await repoAuthentication.authenticate([
          getAuthTokenDescriptor({
            repoUrl: project.sourceRepoUrl,
            readOnly: true,
          }),
        ])
      )[0].token;
      const targetRepoAuthToken = (
        await repoAuthentication.authenticate([
          getAuthTokenDescriptor({
            repoUrl: project.targetRepoUrl,
            readOnly: false,
          }),
        ])
      )[0].token;

      // Call the phase-run action
      const response =
        await clientService.projectsProjectIdModulesModuleIdRunPost({
          path: { projectId: module.projectId, moduleId: module.id },
          body: {
            phase: nextPhase,
            sourceRepoAuth: {
              token: sourceRepoAuthToken,
            },
            targetRepoAuth: {
              token: targetRepoAuthToken,
            },
            // skipping AAP credentials in favor of the app-config.yaml
          },
        });

      const responseData = await response.json();
      if (!responseData.jobId) {
        setError('Failed to run next phase for module');
      }

      forceRefresh();
    },
    [
      clientService,
      forceRefresh,
      repoAuthentication,
      project.sourceRepoUrl,
      project.targetRepoUrl,
    ],
  );

  const actions: MaterialTableProps<Module>['actions'] = [
    (rowData: Module) => ({
      // Idea: this can be a drop-down to select the phase to run
      icon: PlayArrowIcon,
      onClick: () => handleRunNext(rowData),
      tooltip: t('module.actions.runNextPhase'),
      disabled: !canRunNextPhase({ module: rowData }),
    }),
  ];

  return (
    <>
      {error && (
        <Alert severity="error">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
      <Table<Module>
        options={{
          search: false,
          paging: false,
          actionsColumnIndex: -1,
          padding: 'dense',
          toolbar: false,
        }}
        columns={columns}
        data={data}
        actions={actions}
      />
    </>
  );
};
