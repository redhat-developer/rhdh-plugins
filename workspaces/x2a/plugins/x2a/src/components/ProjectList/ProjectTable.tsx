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
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Table,
  TableColumn,
  ResponseErrorPanel,
  LinkButton,
  Link,
} from '@backstage/core-components';

import DeleteIcon from '@material-ui/icons/Delete';
import PlaylistPlayIcon from '@material-ui/icons/PlaylistPlay';
import ReplayIcon from '@material-ui/icons/Replay';
import ChevronRight from '@material-ui/icons/ChevronRight';
import {
  Box,
  Button,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';

import {
  CREATE_CHEF_PROJECT_TEMPLATE_PATH,
  Module,
  Project,
  PROJECT_LIST_SORT_BY_STATUS_HARD_THRESHOLD,
  ProjectsGet,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { usePolledFetch } from '../../hooks/usePolledFetch';
import { useBulkRun } from '../../hooks/useBulkRun';
import { useProjectWriteAccess } from '../../hooks/useProjectWriteAccess';
import { Repository } from '../Repository';
import { OrderDirection } from './types';
import { DetailPanel } from './DetailPanel';
import { ProjectStatusCell } from '../ProjectStatusCell';
import { DeleteProjectDialog } from '../DeleteProjectDialog';
import { BulkRunConfirmDialog } from '../BulkRunConfirmDialog';
import { RetriggerInitConfirmDialog } from '../RetriggerInitConfirmDialog';
import {
  extractResponseError,
  areEligibleModulesToRun,
  isEligibleForRetriggerInit,
} from '../tools';
import { useRouteRef } from '@backstage/core-plugin-api';
import { projectRouteRef } from '../../routes';

/**
 * @material-table/core doesn't export a type for the table instance exposed via
 * tableRef. This interface covers the internal API surface we rely on so that
 * call-sites stay type-safe and breakage from library upgrades is caught early.
 */
type MaterialTableRef<T extends object> = {
  dataManager: {
    sortedData: (T & { id?: string })[];
    data: (T & {
      tableData: { showDetailPanel?: (() => React.ReactNode) | undefined };
    })[];
    getRenderState: () => object;
  };
  onToggleDetailPanel: (path: number[], render: () => React.ReactNode) => void;
  setState: (state: object) => void;
};

type ProjectTableProps = {
  forceRefresh: () => void;
  projects: Project[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (pageSize: number) => void;
  orderBy: number;
  orderDirection: OrderDirection;
  setOrderBy: (orderBy: number) => void;
  setOrderDirection: (orderDirection: ProjectsGet['query']['order']) => void;
};

/**
 * Important: Keep in sync with useColumns() hook.
 * Index 0 is the expand/collapse toggle column (not sortable).
 *
 * @returns
 */
export const mapOrderByToSort = (
  orderBy: number,
): ProjectsGet['query']['sort'] => {
  // Index in this array corresponds to the index in the useColumns() hook.
  const mapping: ProjectsGet['query']['sort'][] = [
    undefined,
    'name',
    'status',
    undefined,
    undefined,
    'createdAt',
  ];

  if (orderBy < 0) {
    return mapping[1];
  }

  const result = mapping[orderBy];
  if (!result) {
    throw new Error(`Invalid orderBy: ${orderBy}`);
  }
  return result;
};

const useColumns = (
  orderBy: number,
  orderDirection: OrderDirection,
  allExpanded: boolean,
  onToggleAll: () => void,
  onToggleRow: (rowData: any) => void,
  totalCount: number | undefined,
): TableColumn<Project>[] => {
  const { t } = useTranslation();
  const projectPath = useRouteRef(projectRouteRef);

  const nameCell = useCallback(
    (rowData: Project) => {
      return (
        <Link
          to={projectPath({
            projectId: rowData.id,
          })}
        >
          {rowData.name}
        </Link>
      );
    },
    [projectPath],
  );

  const getDefaultSort = useCallback(
    (index: number): OrderDirection => {
      if (index === orderBy) {
        return orderDirection;
      }
      return undefined;
    },
    [orderBy, orderDirection],
  );

  const isStatusSortable =
    totalCount !== undefined &&
    totalCount > 0 &&
    totalCount <= PROJECT_LIST_SORT_BY_STATUS_HARD_THRESHOLD;

  return useMemo(() => {
    // Important: Keep the order in sync with the mapOrderByToSort() function.
    const columns: TableColumn<Project>[] = [
      {
        title: (
          <Tooltip
            title={
              allExpanded
                ? t('table.actions.collapseAll')
                : t('table.actions.expandAll')
            }
          >
            <IconButton
              aria-label={
                allExpanded
                  ? t('table.actions.collapseAll')
                  : t('table.actions.expandAll')
              }
              size="small"
              onClick={e => {
                e.stopPropagation();
                onToggleAll();
              }}
            >
              <ChevronRight
                style={{
                  transition: 'transform 200ms ease',
                  transform: allExpanded ? 'rotate(90deg)' : 'none',
                }}
              />
            </IconButton>
          </Tooltip>
        ),
        render: (rowData: any) => (
          <IconButton
            aria-label={
              rowData.tableData?.showDetailPanel
                ? t('table.actions.collapseRow')
                : t('table.actions.expandRow')
            }
            size="small"
            onClick={e => {
              e.stopPropagation();
              onToggleRow(rowData);
            }}
          >
            <ChevronRight
              style={{
                transition: 'transform 200ms ease',
                transform: rowData.tableData?.showDetailPanel
                  ? 'rotate(90deg)'
                  : 'none',
              }}
            />
          </IconButton>
        ),
        sorting: false,
        width: '2rem',
        cellStyle: { padding: 0, textAlign: 'center' },
        headerStyle: { padding: 0, textAlign: 'center' },
      },
      {
        title: t('table.columns.name'),
        render: nameCell,
        defaultSort: getDefaultSort(1),
      },
      {
        title: isStatusSortable ? (
          t('table.columns.status')
        ) : (
          // TODO: make this configurable via an env variable
          <Tooltip
            title={t('table.columns.statusSortDisabledTooltip' as any, {
              threshold: String(PROJECT_LIST_SORT_BY_STATUS_HARD_THRESHOLD),
            })}
          >
            <span>{t('table.columns.status')}</span>
          </Tooltip>
        ),
        field: 'status',
        render: (rowData: Project) => (
          <ProjectStatusCell projectStatus={rowData.status} />
        ),
        sorting: isStatusSortable,
        defaultSort: isStatusSortable ? getDefaultSort(2) : undefined,
      },
      {
        title: t('table.columns.sourceRepo'),
        render: (rowData: Project) => {
          return (
            <Repository
              url={rowData.sourceRepoUrl}
              branch={rowData.sourceRepoBranch}
            />
          );
        },
        sorting: false,
      },
      {
        title: t('table.columns.targetRepo'),
        render: (rowData: Project) => {
          return (
            <Repository
              url={rowData.targetRepoUrl}
              branch={rowData.targetRepoBranch}
            />
          );
        },
        sorting: false,
      },
      {
        title: t('table.columns.createdAt'),
        field: 'createdAt',
        type: 'datetime',
        defaultSort: getDefaultSort(5),
      },
    ];

    return columns;
  }, [
    t,
    getDefaultSort,
    nameCell,
    allExpanded,
    onToggleAll,
    onToggleRow,
    isStatusSortable,
  ]);
};

export interface ExpandedModulesEntry {
  modules?: Module[];
  loading: boolean;
  error?: Error;
}

export interface ExpandedModulesState {
  [projectId: string]: ExpandedModulesEntry;
}

/** @internal shape returned by the fetch function inside useExpandedModules */
export interface ExpandedModulesData {
  modules: Record<string, Module[]>;
  errors: Record<string, Error>;
}

/**
 * Centralized polling for modules of all expanded project rows.
 * A single `usePolledFetch` loop fetches modules for every expanded project in
 * one batch, preventing N independent pollers when many rows are expanded.
 *
 * Uses `Promise.allSettled` so that a single project failure does not break
 * module fetching for all other expanded rows.
 */
export function useExpandedModules(expandedIds: string[]): {
  modulesState: ExpandedModulesState;
  refetchModules: () => void;
} {
  const clientService = useClientService();

  const sortedIds = useMemo(() => [...expandedIds].sort(), [expandedIds]);
  const key = sortedIds.join(',');

  const {
    data,
    loading,
    refetch: refetchModules,
  } = usePolledFetch(
    async (): Promise<ExpandedModulesData> => {
      if (sortedIds.length === 0) return { modules: {}, errors: {} };
      const results = await Promise.allSettled(
        sortedIds.map(async id => {
          const response = await clientService.projectsProjectIdModulesGet({
            path: { projectId: id },
          });
          return [id, (await response.json()) as Module[]] as const;
        }),
      );

      const modules: Record<string, Module[]> = {};
      const errors: Record<string, Error> = {};
      results.forEach((result, i) => {
        const id = sortedIds[i];
        if (result.status === 'fulfilled') {
          modules[result.value[0]] = result.value[1];
        } else {
          errors[id] =
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason));
        }
      });
      return { modules, errors };
    },
    [key, clientService],
    {
      initialData:
        sortedIds.length === 0 ? { modules: {}, errors: {} } : undefined,
    },
  );

  const modulesState = useMemo<ExpandedModulesState>(() => {
    const state: ExpandedModulesState = {};
    for (const id of sortedIds) {
      state[id] = {
        modules: data?.modules[id],
        loading: loading && data?.modules[id] === undefined,
        error: data?.errors[id],
      };
    }
    return state;
  }, [sortedIds, data, loading]);

  return { modulesState, refetchModules };
}

const ExpandedModulesContext = createContext<{
  modulesState: ExpandedModulesState;
  forceRefresh: () => void;
}>({ modulesState: {}, forceRefresh: () => {} });

/**
 * Reads module data from {@link ExpandedModulesContext} so that it always
 * receives the latest polled modules, even when Material-Table renders the
 * detail panel from a stale closure captured at toggle time.
 */
const ConnectedDetailPanel = ({ project }: { project: Project }) => {
  const { modulesState, forceRefresh } = useContext(ExpandedModulesContext);
  const ms = modulesState[project.id];
  return (
    <DetailPanel
      project={project}
      forceRefresh={forceRefresh}
      modules={ms?.modules}
      modulesLoading={ms?.loading}
      modulesError={ms?.error}
    />
  );
};

export const ProjectTable = ({
  projects,
  forceRefresh,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onRowsPerPageChange,
  orderBy,
  orderDirection,
  setOrderBy,
  setOrderDirection,
}: ProjectTableProps) => {
  const clientService = useClientService();
  const { t } = useTranslation();
  const { runAllForProject, runAllGlobal, retriggerInit } = useBulkRun();
  const { hasAnyWriteAccess, canWriteProject } = useProjectWriteAccess();

  const [error, setError] = useState<Error | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    new Set(),
  );
  const tableRef = useRef<MaterialTableRef<Project>>(null);

  const expandedIdsArray = useMemo(
    () => Array.from(expandedProjectIds),
    [expandedProjectIds],
  );
  const { modulesState, refetchModules } = useExpandedModules(expandedIdsArray);

  const combinedForceRefresh = useCallback(() => {
    forceRefresh();
    refetchModules();
  }, [forceRefresh, refetchModules]);

  useEffect(() => {
    setAllExpanded(false);
    setExpandedProjectIds(new Set());
  }, [page, pageSize]);

  // Prune expanded IDs that are no longer in the current data set (e.g. after
  // deletion or a polling refresh that removed a project).
  useEffect(() => {
    const currentIds = new Set(projects.map(p => p.id));
    setExpandedProjectIds(prev => {
      const pruned = new Set([...prev].filter(id => currentIds.has(id)));
      return pruned.size !== prev.size ? pruned : prev;
    });
  }, [projects]);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [retriggerInitTarget, setRetriggerInitTarget] =
    useState<Project | null>(null);
  const [isRetriggeringInit, setIsRetriggeringInit] = useState(false);

  const [bulkRunTarget, setBulkRunTarget] = useState<Project | null>(null);
  const [bulkRunGlobalOpen, setBulkRunGlobalOpen] = useState(false);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [globalUserPrompt, setGlobalUserPrompt] = useState('');

  const hasInitEligibleProjects = useMemo(
    () =>
      projects.some(p => canWriteProject(p) && isEligibleForRetriggerInit(p)),
    [projects, canWriteProject],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setError(null);
    setIsDeleting(true);

    try {
      const response = await clientService.projectsProjectIdDelete({
        path: { projectId: deleteTarget.id },
      });

      if (!response.ok) {
        const message = await extractResponseError(
          response,
          t('projectTable.deleteError'),
        );
        setError(new Error(message));
        return;
      }

      combinedForceRefresh();
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkRunProjectConfirm = useCallback(async () => {
    if (!bulkRunTarget) return;
    setError(null);
    setIsBulkRunning(true);

    try {
      const result = await runAllForProject(bulkRunTarget);
      if (result.failed > 0) {
        setError(
          new Error(
            t('bulkRun.errorProject' as any, { name: bulkRunTarget.name }),
          ),
        );
      }
      combinedForceRefresh();
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsBulkRunning(false);
      setBulkRunTarget(null);
    }
  }, [bulkRunTarget, runAllForProject, combinedForceRefresh, t]);

  const handleBulkRunGlobalConfirm = useCallback(async () => {
    setError(null);
    setIsBulkRunning(true);

    try {
      const result = await runAllGlobal(
        canWriteProject,
        globalUserPrompt || undefined,
      );
      if (result.failed > 0) {
        setError(new Error(t('bulkRun.errorGlobal')));
      }
      combinedForceRefresh();
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsBulkRunning(false);
      setBulkRunGlobalOpen(false);
      setGlobalUserPrompt('');
    }
  }, [
    runAllGlobal,
    canWriteProject,
    globalUserPrompt,
    combinedForceRefresh,
    t,
  ]);

  const handleRetriggerInitConfirm = useCallback(
    async (userPrompt: string) => {
      if (!retriggerInitTarget) return;
      setError(null);
      setIsRetriggeringInit(true);

      try {
        await retriggerInit(retriggerInitTarget, userPrompt || undefined);
        combinedForceRefresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(
          new Error(
            `${t('retriggerInit.error' as any, {
              name: retriggerInitTarget.name,
            })}: ${msg}`,
          ),
        );
      } finally {
        setIsRetriggeringInit(false);
        setRetriggerInitTarget(null);
      }
    },
    [retriggerInitTarget, retriggerInit, combinedForceRefresh, t],
  );

  const handleOrderChange = (sortBy: number, od: OrderDirection) => {
    setOrderBy(sortBy);
    setOrderDirection(od);
  };

  const handleToggleRow = useCallback(
    (
      rowData: Project & {
        tableData?: { showDetailPanel?: (() => React.ReactNode) | undefined };
      },
    ) => {
      const tableInstance = tableRef.current;
      if (!tableInstance) return;

      const { dataManager } = tableInstance;
      const index = dataManager.sortedData.findIndex(
        row => row === rowData || row.id === rowData.id,
      );
      if (index < 0) return;

      const wasExpanded = !!rowData.tableData?.showDetailPanel;

      tableInstance.onToggleDetailPanel([index], () => (
        <ConnectedDetailPanel project={rowData} />
      ));

      setExpandedProjectIds(prev => {
        const next = new Set(prev);
        if (wasExpanded) {
          next.delete(rowData.id);
        } else {
          next.add(rowData.id);
        }
        return next;
      });
      if (wasExpanded) {
        setAllExpanded(false);
      } else {
        const allNowExpanded =
          dataManager.data.length > 0 &&
          dataManager.data.every(
            row => row === rowData || !!row.tableData.showDetailPanel,
          );
        setAllExpanded(allNowExpanded);
      }
    },
    [],
  );

  const handleToggleAllDetailPanels = useCallback(() => {
    const tableInstance = tableRef.current;
    if (!tableInstance) return;

    const { dataManager } = tableInstance;
    const allCurrentlyExpanded =
      dataManager.data.length > 0 &&
      dataManager.data.every(row => !!row.tableData.showDetailPanel);

    const newExpanded = !allCurrentlyExpanded;
    setAllExpanded(newExpanded);

    if (newExpanded) {
      setExpandedProjectIds(
        new Set(
          dataManager.data.map(row => row.id).filter(Boolean) as string[],
        ),
      );
    } else {
      setExpandedProjectIds(new Set());
    }

    dataManager.data.forEach(row => {
      row.tableData.showDetailPanel = newExpanded
        ? () => <ConnectedDetailPanel project={row} />
        : undefined;
    });

    tableInstance.setState(dataManager.getRenderState());
  }, []);

  const columns = useColumns(
    orderBy,
    orderDirection,
    allExpanded,
    handleToggleAllDetailPanels,
    handleToggleRow,
    totalCount,
  );
  const data = projects;

  const actions = [
    (rowData: Project) => ({
      icon: ReplayIcon,
      onClick: () => setRetriggerInitTarget(rowData),
      tooltip: t('table.actions.retriggerInit'),
      hidden: !isEligibleForRetriggerInit(rowData),
      disabled: !canWriteProject(rowData),
    }),
    (rowData: Project) => ({
      icon: PlaylistPlayIcon,
      onClick: () => setBulkRunTarget(rowData),
      tooltip: t('bulkRun.projectAction'),
      disabled: !canWriteProject(rowData) || !areEligibleModulesToRun(rowData),
    }),
    (rowData: Project) => ({
      icon: DeleteIcon,
      onClick: () => setDeleteTarget(rowData),
      tooltip: t('table.actions.deleteProject'),
      disabled: !canWriteProject(rowData),
    }),
  ];

  return (
    <Grid container spacing={3} direction="column">
      <DeleteProjectDialog
        open={!!deleteTarget}
        projectName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <RetriggerInitConfirmDialog
        open={!!retriggerInitTarget}
        projectName={retriggerInitTarget?.name ?? ''}
        isRunning={isRetriggeringInit}
        onConfirm={handleRetriggerInitConfirm}
        onClose={() => !isRetriggeringInit && setRetriggerInitTarget(null)}
      />

      <BulkRunConfirmDialog
        idPostfix="project-single"
        open={!!bulkRunTarget}
        title={t('bulkRun.projectConfirm.title' as any, {
          name: bulkRunTarget?.name ?? '',
        })}
        message={t('bulkRun.projectConfirm.message')}
        isRunning={isBulkRunning}
        onConfirm={handleBulkRunProjectConfirm}
        onClose={() => !isBulkRunning && setBulkRunTarget(null)}
      />

      <BulkRunConfirmDialog
        idPostfix="project-global"
        open={bulkRunGlobalOpen}
        title={t('bulkRun.globalConfirm.title')}
        message={t('bulkRun.globalConfirm.message')}
        isRunning={isBulkRunning}
        onConfirm={handleBulkRunGlobalConfirm}
        onClose={() => {
          if (!isBulkRunning) {
            setBulkRunGlobalOpen(false);
            setGlobalUserPrompt('');
          }
        }}
      >
        {hasInitEligibleProjects ? (
          <>
            <Typography variant="body1" style={{ marginTop: 16 }}>
              {t('bulkRun.globalConfirm.messageInitRetrigger')}
            </Typography>
            <TextField
              label={t('bulkRun.globalConfirm.userPromptLabel')}
              placeholder={t('bulkRun.globalConfirm.userPromptPlaceholder')}
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
              variant="outlined"
              margin="normal"
              value={globalUserPrompt}
              onChange={e => setGlobalUserPrompt(e.target.value)}
              disabled={isBulkRunning}
              inputProps={{ 'data-testid': 'global-run-all-user-prompt' }}
            />
          </>
        ) : (
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginTop: 16 }}
          >
            {t('bulkRun.globalConfirm.noInitEligible')}
          </Typography>
        )}
      </BulkRunConfirmDialog>

      {error && (
        <Grid item>
          <ResponseErrorPanel error={error} />
        </Grid>
      )}

      <Grid item>
        <Box display="flex" justifyContent="flex-end" gridGap={8}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PlaylistPlayIcon />}
            onClick={() => setBulkRunGlobalOpen(true)}
            disabled={!hasAnyWriteAccess}
          >
            {t('bulkRun.globalAction')}
          </Button>
          <LinkButton
            variant="contained"
            color="primary"
            to={CREATE_CHEF_PROJECT_TEMPLATE_PATH}
          >
            {t('common.newProject')}
          </LinkButton>
        </Box>
      </Grid>

      <ExpandedModulesContext.Provider
        value={{ modulesState, forceRefresh: combinedForceRefresh }}
      >
        <Grid item>
          <Table<Project>
            title={t('table.projectsCount' as any, {
              count: totalCount.toString(),
            })}
            options={{
              search: false,
              paging: true,
              actionsColumnIndex: -1 /* to the row end */,
              padding: 'default',
              pageSize: pageSize,
              showDetailPanelIcon: false,
            }}
            columns={columns}
            data={data}
            actions={actions}
            detailPanel={({ rowData }: { rowData: Project }) => (
              <ConnectedDetailPanel project={rowData} />
            )}
            tableRef={tableRef}
            onOrderChange={handleOrderChange}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            totalCount={totalCount}
          />
        </Grid>
      </ExpandedModulesContext.Provider>
    </Grid>
  );
};
