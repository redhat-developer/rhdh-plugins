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

import { Entity } from '@backstage/catalog-model';
import { Link, StatusOK } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

import Typography from '@mui/material/Typography';
import * as jsyaml from 'js-yaml';
import { get } from 'lodash';
import * as yaml from 'yaml';
import * as yup from 'yup';

import { WaitingForPR } from '../components/WaitingForPR';
import {
  AddedRepositories,
  AddRepositoryData,
  APITypes,
  ApprovalTool,
  CreateImportJobRepository,
  ErrorType,
  ImportJobResponse,
  ImportJobs,
  ImportJobStatus,
  ImportStatus,
  isGithubJob,
  JobErrors,
  Order,
  OrgAndRepoResponse,
  PullRequestPreview,
  Repository,
  RepositorySelection,
  RepositoryStatus,
} from '../types';
import { getTaskStatusInfo } from './task-status';

const TaskLink = ({
  labelText,
  taskId,
}: {
  labelText: string;
  taskId?: string;
}) => {
  const configApi = useApi(configApiRef);
  const appBaseUrl = configApi.getString('app.baseUrl');

  if (!taskId) return <>{labelText}</>;

  return (
    <Link
      to={`${appBaseUrl}/create/tasks/${taskId}`}
      data-testid="pull request url"
      style={{
        paddingLeft: '5px',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {labelText}
    </Link>
  );
};

export const descendingComparator = (
  a: AddRepositoryData,
  b: AddRepositoryData,
  orderBy: string,
) => {
  let value1 = get(a, orderBy);
  let value2 = get(b, orderBy);
  const order = {
    [RepositoryStatus.ADDED]: 1,
    [RepositoryStatus.Ready]: 2,
    [RepositoryStatus.WAIT_PR_APPROVAL]: 3,
    [RepositoryStatus.PR_ERROR]: 4,
    [RepositoryStatus.CATALOG_ENTITY_CONFLICT]: 4,
    [RepositoryStatus.CATALOG_INFO_FILE_EXISTS_IN_REPO]: 4,
    [RepositoryStatus.CODEOWNERS_FILE_NOT_FOUND_IN_REPO]: 4,
    [RepositoryStatus.REPO_EMPTY]: 4,
    [RepositoryStatus.NotGenerated]: 5,
  };

  if (orderBy === 'selectedRepositories') {
    value1 = Object.keys(value1)?.length;
    value2 = Object.values(value2)?.length;
  }

  if (orderBy === 'catalogInfoYaml.status') {
    value1 = order[(value1 as ImportStatus) || RepositoryStatus.NotGenerated];
    value2 = order[(value2 as ImportStatus) || RepositoryStatus.NotGenerated];
  }
  if (value2 < value1) {
    return -1;
  }
  if (value2 > value1) {
    return 1;
  }
  return 0;
};

export const getComparator = (
  order: Order,
  orderBy: string,
): ((a: AddRepositoryData, b: AddRepositoryData) => number) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

export const defaultCatalogInfoYaml = (
  componentName: string,
  repoName: string,
  orgName: string,
  owner: string,
  gitProvider: 'github' | 'gitlab',
) => {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: componentName,
      annotations: {
        [`${gitProvider}.com/project-slug`]: `${orgName}/${repoName}`,
      },
    },
    spec: { type: 'other', lifecycle: 'unknown', owner },
  };
};

export const componentNameRegex =
  /^([a-zA-Z0-9]+[-_.])*[a-zA-Z0-9]+$|^[a-zA-Z0-9]{1,63}$/;

export const cleanComponentName = (input: string) => {
  // Remove leading and trailing dots, underscores, dollar or hyphens
  const cleanedStr = input.replace(/^[$._-]+|[$._-]+$/g, '');

  if (componentNameRegex.test(input)) {
    return input;
  }
  if (componentNameRegex.test(cleanedStr)) {
    return cleanedStr;
  }
  return 'my-component';
};

export const getPRTemplate = (
  componentName: string,
  orgName: string,
  entityOwner: string,
  baseUrl: string,
  repositoryUrl: string,
  defaultBranch: string,
  gitProvider: 'github' | 'gitlab',
): PullRequestPreview => {
  const importJobUrl = repositoryUrl
    ? `${baseUrl}/bulk-import/repositories?repository=${repositoryUrl}&defaultBranch=${defaultBranch}`
    : `${baseUrl}/bulk-import/repositories`;
  const name = cleanComponentName(componentName);
  return {
    componentName: name,
    entityOwner,
    prTitle: 'Add catalog-info.yaml config file',
    prDescription: `This pull request adds a **Backstage entity metadata file**\nto this repository so that the component can\nbe added to the [software catalog](${baseUrl}/catalog).\nAfter this pull request is merged, the component will become available.\nFor more information, read an [overview of the Backstage software catalog](https://backstage.io/docs/features/software-catalog/).\nView the import job in your app [here](${importJobUrl}).`,
    useCodeOwnersFile: false,
    yaml: defaultCatalogInfoYaml(
      name,
      componentName,
      orgName,
      entityOwner,
      gitProvider,
    ),
  };
};

export const getYamlKeyValuePairs = (
  prYamlInput: string,
): Record<string, string> => {
  const keyValuePairs: Record<string, string> = {};
  const keyValueEntries = prYamlInput.split(';').map(entry => entry.trim());

  keyValueEntries.forEach(entry => {
    const [key, ...valueParts] = entry.split(':');
    const value = valueParts.join(':').trim();
    if (key && value) {
      keyValuePairs[key.trim()] = value.replace(/(^['"])|(['"]$)/g, '');
    }
  });

  return keyValuePairs;
};

export const updateWithNewSelectedRepositories = (
  existingSelectedRepositories: AddedRepositories,
  selectedRepos: AddedRepositories,
): AddedRepositories => {
  return Object.keys(selectedRepos).length === 0
    ? {}
    : Object.keys(selectedRepos).reduce((acc, sr) => {
        const existingRepo = existingSelectedRepositories[sr];
        if (existingRepo) {
          return {
            ...acc,
            ...{ [existingRepo.id]: existingRepo },
          };
        }
        return {
          ...acc,
          ...{
            [sr]: {
              ...selectedRepos[sr],
              catalogInfoYaml: {
                ...selectedRepos[sr].catalogInfoYaml,
                status: RepositoryStatus.Ready,
              },
            },
          },
        };
      }, {});
};

export const filterSelectedForActiveDrawer = (
  repositories: AddRepositoryData[],
  selectedRepos: AddedRepositories,
): AddedRepositories => {
  return Object.keys(selectedRepos).reduce(
    (acc, repoId) =>
      repositories?.map(r => r.id).includes(repoId)
        ? { ...acc, repoId: selectedRepos[repoId] }
        : acc,
    {},
  );
};

export const filterSelectedRepositoriesOnActivePage = (
  activePageTableData: AddRepositoryData[],
  selectedRepositories: AddedRepositories,
) => {
  return Object.keys(selectedRepositories).filter(repoId => {
    return activePageTableData.some(activeRepo => activeRepo.id === repoId);
  });
};

export const urlHelper = (url: string) => {
  if (!url || url === '') {
    return '-';
  }
  return url.split('https://')[1] || url;
};

export const getImportStatus = (
  status: string,
  t: (key: string) => string,
  showIcon?: boolean,
  prUrl?: string,
  taskId?: string,
) => {
  if (!status) {
    return '';
  }
  const labelText = t('status.imported');

  if (status === 'WAIT_PR_APPROVAL') {
    return showIcon ? (
      <WaitingForPR url={prUrl as string} />
    ) : (
      t('status.waitingForApproval')
    );
  }

  if (status === 'ADDED') {
    return showIcon ? (
      <Typography
        component="span"
        style={{ display: 'flex', alignItems: 'baseline' }}
      >
        <StatusOK />
        {t('status.imported')}
      </Typography>
    ) : (
      labelText
    );
  }

  if (taskId && status.startsWith('TASK')) {
    const { taskLabelText, taskIcon } = getTaskStatusInfo(status, t);
    return showIcon ? (
      <Typography
        component="span"
        style={{ display: 'flex', alignItems: 'baseline' }}
      >
        {taskIcon}
        <TaskLink labelText={taskLabelText} taskId={taskId} />
      </Typography>
    ) : (
      <TaskLink labelText={taskLabelText} taskId={taskId} />
    );
  }

  return '';
};

export const evaluateRowForRepo = (
  tableData: AddRepositoryData[],
  selectedRepositories: AddedRepositories,
) => {
  return tableData.map(td => {
    const repo = selectedRepositories[td.id];
    if (repo) {
      const newtd = {
        ...td,
        catalogInfoYaml: repo.catalogInfoYaml,
      };
      return newtd;
    }
    return td;
  });
};

export const evaluateRowForOrg = (
  tableData: AddRepositoryData[],
  selectedRepositories: AddedRepositories,
) => {
  return tableData?.map(td => {
    const selectedReposFromOrg =
      Object.values(selectedRepositories)?.reduce(
        (acc, repo) =>
          repo.orgName === td.orgName ? { ...acc, [repo.id]: repo } : acc,
        {},
      ) || [];

    const orgRowData = {
      ...td,
      selectedRepositories: selectedReposFromOrg,
      ...(Object.keys(selectedReposFromOrg)?.length > 0
        ? {
            catalogInfoYaml: {
              status: RepositoryStatus.Ready,
            },
          }
        : {}),
    };
    return orgRowData;
  });
};

export const areAllRowsSelected = (
  repositoryType: RepositorySelection,
  alreadyAdded: number,
  isItemSelected: boolean | undefined,
  orgRepositoriesCount: number,
  selectedRepositories: AddedRepositories,
) => {
  return repositoryType === RepositorySelection.Organization
    ? (Object.keys(selectedRepositories)?.length || 0) + alreadyAdded ===
        orgRepositoriesCount
    : !!isItemSelected;
};

export const getJobErrors = (
  createJobResponse: ImportJobResponse[],
): JobErrors => {
  return createJobResponse?.reduce(
    (acc: JobErrors, res: ImportJobResponse) => {
      if (res.errors?.length > 0) {
        const errs =
          res.status === RepositoryStatus.PR_ERROR
            ? [res.status]
            : res.errors.filter(
                e => e !== RepositoryStatus.CATALOG_INFO_FILE_EXISTS_IN_REPO,
              );
        const hasInfo = res.errors.includes(
          RepositoryStatus.CATALOG_INFO_FILE_EXISTS_IN_REPO,
        );
        const repoId = `${res.repository.organization}/${res.repository.name}`;
        const repoErr: ErrorType = {
          [`${repoId}`]: {
            repository: {
              name: res.repository.name || '',
              organization: res.repository.organization || '',
            },
            catalogEntityName: res.catalogEntityName || '',
            error: {
              message: errs,
            },
          },
        };

        const repoInfo: ErrorType = {
          [`${repoId}`]: {
            ...repoErr[`${repoId}`],
            error: {
              message: [RepositoryStatus.CATALOG_INFO_FILE_EXISTS_IN_REPO],
            },
          },
        };
        return {
          ...acc,
          ...(hasInfo ? { infos: { ...acc.infos, ...repoInfo } } : {}),
          ...(errs.length > 0 ? { errors: { ...acc.errors, ...repoErr } } : {}),
        };
      }
      return acc;
    },
    { infos: null, errors: null } as JobErrors,
  );
};

export const convertKeyValuePairsToString = (
  keyValuePairs?: Record<string, string>,
): string => {
  return keyValuePairs
    ? Object.entries(keyValuePairs)
        .filter(val => val)
        .map(([key, value]) => `${key.trim()}: ${value?.trim() || ''}`)
        .join('; ')
    : '';
};

export const prepareDataForSubmission = (
  repositories: AddedRepositories,
  approvalTool: ApprovalTool,
) =>
  Object.values(repositories).reduce(
    (acc: CreateImportJobRepository[], repo) => {
      const gitProvider =
        approvalTool === ApprovalTool.Gitlab ? 'gitlab' : 'github';
      acc.push({
        approvalTool: approvalTool,
        codeOwnersFileAsEntityOwner:
          repo.catalogInfoYaml?.prTemplate?.useCodeOwnersFile || false,
        catalogEntityName:
          repo.catalogInfoYaml?.prTemplate?.componentName ||
          repo?.repoName ||
          'my-component',
        repository: {
          id: repo.id,
          url: repo.repoUrl || '',
          name: repo.repoName || '',
          organization: repo.orgName || '',
          defaultBranch: repo.defaultBranch || '',
        },
        catalogInfoContent: yaml.stringify(
          repo.catalogInfoYaml?.prTemplate?.yaml,
          null,
          2,
        ),
        [gitProvider]: {
          pullRequest: {
            title:
              repo.catalogInfoYaml?.prTemplate?.prTitle ||
              'Add catalog-info.yaml config file',
            body: repo.catalogInfoYaml?.prTemplate?.prDescription || '',
          },
        },
      });
      return acc;
    },
    [],
  );

export const getApi = (
  backendUrl: string,
  page: number,
  size: number,
  searchString: string,
  approvalTool: string,
  options?: APITypes,
) => {
  if (options?.fetchOrganizations) {
    return `${backendUrl}/api/bulk-import/organizations?pagePerIntegration=${page}&sizePerIntegration=${size}&search=${searchString}&approvalTool=${approvalTool}`;
  }
  if (options?.orgName) {
    return `${backendUrl}/api/bulk-import/organizations/${options.orgName}/repositories?pagePerIntegration=${page}&sizePerIntegration=${size}&search=${searchString}&approvalTool=${approvalTool}`;
  }
  return `${backendUrl}/api/bulk-import/repositories?pagePerIntegration=${page}&sizePerIntegration=${size}&search=${searchString}&approvalTool=${approvalTool}`;
};

export const getCustomisedErrorMessage = (
  status: (RepositoryStatus | string)[] | undefined,
  t: (key: string) => string,
) => {
  let message = '';
  let showRepositoryLink = false;
  status?.forEach(s => {
    if (s === RepositoryStatus.PR_ERROR) {
      message = message.concat(t('errors.prErrorPermissions'), '\n');
      showRepositoryLink = true;
    }

    if (s === RepositoryStatus.CATALOG_INFO_FILE_EXISTS_IN_REPO) {
      message = message.concat(t('errors.catalogInfoExists'), '\n');
    }

    if (s === RepositoryStatus.CATALOG_ENTITY_CONFLICT) {
      message = message.concat(t('errors.catalogEntityConflict'), '\n');
    }

    if (s === RepositoryStatus.REPO_EMPTY) {
      message = message.concat(t('errors.repoEmpty'), '\n');
    }

    if (s === RepositoryStatus.CODEOWNERS_FILE_NOT_FOUND_IN_REPO) {
      message = message.concat(t('errors.codeOwnersNotFound'), '\n');
    }
  });
  if (!message) {
    message = status?.join('\n') || '';
  }
  return { message, showRepositoryLink };
};

export const calculateLastUpdated = (
  dateString: string,
  t: (key: string, params?: any) => string,
) => {
  if (!dateString) {
    return '';
  }

  const givenDate = new Date(dateString);
  const currentDate = new Date();

  // Calculate the difference in milliseconds
  const diffInMilliseconds: number =
    currentDate.getTime() - givenDate.getTime();

  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return t('time.daysAgo', { count: diffInDays });
  }
  if (diffInHours > 0) {
    return t('time.hoursAgo', { count: diffInHours });
  }
  if (diffInMinutes > 0) {
    return t('time.minutesAgo', { count: diffInMinutes });
  }
  return t('time.secondsAgo', { count: diffInSeconds });
};

export const evaluatePRTemplate = (
  repositoryStatus: ImportJobStatus,
): { pullReqPreview: PullRequestPreview; isInvalidEntity: boolean } => {
  const gitProvider = isGithubJob(repositoryStatus) ? 'github' : 'gitlab';
  try {
    const entity = jsyaml.loadAll(
      repositoryStatus[gitProvider]?.pullRequest.catalogInfoContent ?? '',
    )[0] as Entity;
    const isInvalid =
      !entity?.metadata?.name || !entity?.apiVersion || !entity?.kind;
    return {
      pullReqPreview: {
        pullRequestUrl: repositoryStatus[gitProvider]?.pullRequest.url,
        prTitle: repositoryStatus[gitProvider]?.pullRequest.title,
        prDescription: repositoryStatus[gitProvider]?.pullRequest.body,
        prAnnotations: convertKeyValuePairsToString(
          entity?.metadata?.annotations,
        ),
        prLabels: convertKeyValuePairsToString(entity?.metadata?.labels),
        prSpec: convertKeyValuePairsToString(
          entity?.spec as Record<string, string>,
        ),
        componentName: entity?.metadata?.name,
        entityOwner: entity?.spec?.owner as string,
        useCodeOwnersFile: !entity?.spec?.owner,
        yaml: entity,
      },
      isInvalidEntity: isInvalid,
    };
  } catch (e) {
    return {
      pullReqPreview: {
        pullRequestUrl: repositoryStatus[gitProvider]?.pullRequest.url,
        prTitle: repositoryStatus[gitProvider]?.pullRequest.title,
        prDescription: repositoryStatus[gitProvider]?.pullRequest.body,
        prAnnotations: undefined,
        prLabels: undefined,
        prSpec: undefined,
        componentName: undefined,
        entityOwner: undefined,
        useCodeOwnersFile: false,
        yaml: {} as Entity,
      },
      isInvalidEntity: true,
    };
  }
};

export const prepareDataForOrganizations = (result: OrgAndRepoResponse) => {
  const orgData: { [id: string]: AddRepositoryData } =
    result?.organizations?.reduce(
      (acc: { [id: string]: AddRepositoryData }, val: Repository) => {
        return {
          ...acc,
          [val.id]: {
            id: val.id,
            orgName: val.name,
            organizationUrl: `${val?.url}`,
            totalReposInOrg: val.totalRepoCount,
            approvalTool: result.approvalTool,
          },
        };
      },
      {},
    ) || {};
  return { organizations: orgData, totalOrganizations: result?.totalCount };
};

export const prepareDataForRepositories = (
  result: OrgAndRepoResponse,
  user: string,
  baseUrl: string,
) => {
  const gitProvider =
    result?.approvalTool === ApprovalTool.Gitlab ? 'gitlab' : 'github';
  const repoData: { [id: string]: AddRepositoryData } =
    result?.repositories?.reduce((acc, val: Repository) => {
      const id = val.id;
      return {
        ...acc,
        [id]: {
          id,
          repoName: val.name,
          approvalTool: result?.approvalTool ?? ApprovalTool.Git,
          defaultBranch: val.defaultBranch || 'main',
          orgName: val.organization,
          repoUrl: val.url,
          organizationUrl: val.url?.substring(
            0,
            val.url.indexOf(val?.name || '') - 1,
          ),
          catalogInfoYaml: {
            prTemplate: getPRTemplate(
              val.name || '',
              val.organization || '',
              user,
              baseUrl || '',
              val.url || '',
              val.defaultBranch || 'main',
              gitProvider,
            ),
          },
        },
      };
    }, {}) || {};
  return { repositories: repoData, totalRepositories: result?.totalCount };
};

export const prepareDataForAddedRepositories = (
  addedRepositories: ImportJobs | Response | undefined,
  user: string,
  baseUrl: string,
): { repoData: AddedRepositories; totalJobs: number } => {
  if (!Array.isArray((addedRepositories as ImportJobs)?.imports)) {
    return { repoData: {}, totalJobs: 0 };
  }
  const importJobs = addedRepositories as ImportJobs;
  const repoData: { [id: string]: AddRepositoryData } =
    importJobs.imports?.reduce((acc, val: ImportJobStatus) => {
      const id = `${val.repository.organization}/${val.repository.name}`;
      const gitProvider = isGithubJob(val) ? 'github' : 'gitlab';
      return {
        ...acc,
        [id]: {
          id,
          source: val.source,
          task: {
            id: val.task?.taskId,
            status: val.status,
          },
          approvalTool: val.approvalTool,
          repoName: val.repository.name,
          defaultBranch: val.repository.defaultBranch,
          orgName: val.repository.organization,
          repoUrl: val.repository.url,
          organizationUrl: val?.repository?.url?.substring(
            0,
            val.repository.url.indexOf(val?.repository?.name || '') - 1,
          ),
          catalogInfoYaml: {
            status: val.status
              ? RepositoryStatus[val.status as RepositoryStatus]
              : RepositoryStatus.NotGenerated,
            prTemplate: getPRTemplate(
              val.repository.name || '',
              val.repository.organization || '',
              user,
              baseUrl,
              val.repository.url || '',
              val.repository.defaultBranch || 'main',
              gitProvider,
            ),
            pullRequest: val[gitProvider]?.pullRequest?.url || '',
            lastUpdated: val.lastUpdate,
          },
        },
      };
    }, {});
  return {
    repoData,
    totalJobs: (addedRepositories as ImportJobs)?.totalCount || 0,
  };
};

const validateKeyValuePair = (t: (key: string) => string) =>
  yup
    .string()
    .nullable()
    .test('is-key-value-pair', t('validation.keyValuePairFormat'), value => {
      if (!value) return true;
      const keyValuePairs = value.split(';').map(pair => pair.trim());
      for (const pair of keyValuePairs) {
        if (pair) {
          const [key, val] = pair.split(':').map(part => part.trim());
          if (!key || !val) {
            return false;
          }
        }
      }
      return true;
    });

export const getValidationSchema = (
  approvalTool: string,
  t: (key: string, params?: any) => string,
) =>
  yup.object().shape({
    prTitle: yup
      .string()
      .required(t('validation.titleRequired', { approvalTool })),
    prDescription: yup
      .string()
      .required(t('validation.descriptionRequired', { approvalTool })),
    componentName: yup
      .string()
      .matches(
        componentNameRegex,
        t('validation.componentNameInvalid', { value: yup.string() }),
      )
      .required(t('validation.componentNameRequired')),
    useCodeOwnersFile: yup.boolean(),
    entityOwner: yup.string().when('useCodeOwnersFile', {
      is: false,
      then: schema => schema.required(t('validation.entityOwnerRequired')),
      otherwise: schema => schema.notRequired(),
    }),
    prLabels: validateKeyValuePair(t),
    prAnnotations: validateKeyValuePair(t),
    prSpec: validateKeyValuePair(t),
  });
