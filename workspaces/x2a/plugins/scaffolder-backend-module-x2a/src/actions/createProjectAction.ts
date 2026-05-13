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
import { DiscoveryService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  DefaultApiClient,
  buildScmHostMap,
  ScmProviderName,
  resolveScmProvider,
  parseCsvContent,
  SCAFFOLDER_SECRET_PREFIX,
  ScmProvider,
  allProviders,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { createAndInitProject } from './createAndInitProject';

export type { CsvProjectRow } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
export { parseCsvContent } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export type ActionLogger = {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
};

// From the user's perspective, not globally.
const fetchExistingProjectNames = async (
  api: DefaultApiClient,
  token?: string,
): Promise<Set<string>> => {
  const names = new Set<string>();
  let page = 0;
  const pageSize = 100;

  for (;;) {
    let data;
    try {
      const response = await api.projectsGet(
        { query: { page, pageSize } },
        { token },
      );
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          `status ${response.status}: ${errorBody?.message ?? JSON.stringify(errorBody)}`,
        );
      }
      data = await response.json();
    } catch (e) {
      throw new Error(
        `Failed to list existing projects: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (!data.items || data.items.length === 0) {
      break;
    }

    for (const project of data.items) {
      names.add(project.name);
    }
    if (data.items.length < pageSize) {
      break;
    }
    page++;
  }

  return names;
};

function extractProviderTokens(
  secrets: Record<string, string> | undefined,
): Map<ScmProviderName, string> {
  const providerTokens = new Map<ScmProviderName, string>();
  Object.entries(secrets ?? {}).forEach(([key, value]) => {
    if (!key.startsWith(SCAFFOLDER_SECRET_PREFIX)) return;
    const providerName = key.replace(SCAFFOLDER_SECRET_PREFIX, '');
    if (allProviders.some((p: ScmProvider) => p.name === providerName)) {
      providerTokens.set(providerName as ScmProviderName, value);
    }
  });
  return providerTokens;
}

async function handleManualCreation(params: {
  input: {
    name: string;
    description?: string;
    ownedByGroup?: string;
    sourceRepoUrl: string;
    sourceRepoBranch: string;
    areTargetAndSourceRepoShared: boolean;
    targetRepoUrl?: string;
    targetRepoBranch: string;
    userPrompt?: string;
    acceptedRuleIds?: string;
  };
  secrets: Record<string, string> | undefined;
  api: DefaultApiClient;
  token?: string;
  existingProjectNames: Set<string>;
  hostProviderMap: Map<string, ScmProviderName>;
  logger: ActionLogger;
}): Promise<{ projectId: string; initJobId: string }> {
  const {
    input,
    secrets,
    api,
    token,
    existingProjectNames,
    hostProviderMap,
    logger,
  } = params;

  const sourceRepoUrl = input.sourceRepoUrl;
  const targetRepoUrl = input.areTargetAndSourceRepoShared
    ? sourceRepoUrl
    : input.targetRepoUrl;
  if (!targetRepoUrl) {
    throw new Error('Target repository URL is required');
  }

  const sourceProvider = resolveScmProvider(sourceRepoUrl, hostProviderMap);
  const rawSourceToken = secrets?.SRC_USER_OAUTH_TOKEN;
  if (!rawSourceToken) {
    throw new Error('Source repository token is required');
  }
  const sourceRepoToken = sourceProvider.augmentToken(rawSourceToken);

  let targetRepoToken: string;
  if (input.areTargetAndSourceRepoShared) {
    targetRepoToken = sourceRepoToken;
  } else {
    const targetProvider = resolveScmProvider(targetRepoUrl, hostProviderMap);
    const rawTargetToken = secrets?.TGT_USER_OAUTH_TOKEN;
    if (!rawTargetToken) {
      throw new Error('Target repository token is required');
    }
    targetRepoToken = targetProvider.augmentToken(rawTargetToken);
  }

  if (existingProjectNames.has(input.name)) {
    throw new Error(
      `A project named "${input.name}" already exists. ` +
        `To import it anyway, either change the project name or delete the existing project.`,
    );
  }

  // Parse acceptedRuleIds from JSON string (scaffolder field value)
  let acceptedRuleIds: string[] | undefined;
  if (input.acceptedRuleIds) {
    try {
      acceptedRuleIds = JSON.parse(input.acceptedRuleIds);
    } catch {
      logger.warn('Failed to parse acceptedRuleIds, ignoring');
    }
  }

  return createAndInitProject({
    api,
    row: {
      name: input.name,
      description: input.description ?? '',
      ownedByGroup: input.ownedByGroup,
      sourceRepoUrl,
      targetRepoUrl,
      sourceRepoBranch: input.sourceRepoBranch,
      targetRepoBranch: input.targetRepoBranch,
    },
    sourceRepoToken,
    targetRepoToken,
    userPrompt: input.userPrompt,
    acceptedRuleIds,
    backstageToken: token,
    hostProviderMap,
    logger,
  });
}

async function handleCsvBulkImport(params: {
  csvContent: string;
  secrets: Record<string, string> | undefined;
  api: DefaultApiClient;
  token?: string;
  existingProjectNames: Set<string>;
  hostProviderMap: Map<string, ScmProviderName>;
  userPrompt?: string;
  logger: ActionLogger;
}): Promise<{
  successCount: number;
  errorCount: number;
  skippedCount: number;
}> {
  const {
    csvContent,
    secrets,
    api,
    token,
    existingProjectNames,
    hostProviderMap,
    userPrompt,
    logger,
  } = params;

  const projectsToCreate = parseCsvContent(csvContent);
  const providerTokens = extractProviderTokens(secrets);

  if (providerTokens.size === 0) {
    throw new Error(
      'At least one SCM provider authentication token is required for CSV import',
    );
  }

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const row of projectsToCreate) {
    if (existingProjectNames.has(row.name)) {
      logger.warn(
        `Skipping project "${row.name}": a project with this name already exists. ` +
          `To import it anyway, either change the project name or delete the existing project.`,
      );
      skippedCount++;
      continue;
    }

    const sourceProvider = resolveScmProvider(
      row.sourceRepoUrl,
      hostProviderMap,
    );
    const sourceRepoToken = providerTokens.get(sourceProvider.name);
    if (!sourceRepoToken) {
      logger.error(
        `Skipping project "${row.name}": no ${sourceProvider.name} authentication token provided (source: ${row.sourceRepoUrl})`,
      );
      errorCount++;
      continue;
    }

    const targetProvider = resolveScmProvider(
      row.targetRepoUrl,
      hostProviderMap,
    );
    const targetRepoToken = providerTokens.get(targetProvider.name);
    if (!targetRepoToken) {
      logger.error(
        `Skipping project "${row.name}": no ${targetProvider.name} authentication token provided (target: ${row.targetRepoUrl})`,
      );
      errorCount++;
      continue;
    }

    try {
      await createAndInitProject({
        api,
        row,
        sourceRepoToken,
        targetRepoToken,
        userPrompt,
        acceptedRuleIds: row.acceptedRuleIds,
        backstageToken: token,
        hostProviderMap,
        logger,
      });
      existingProjectNames.add(row.name);
      successCount++;
    } catch (e) {
      logger.error(
        `Failed to create project "${row.name}": ${e instanceof Error ? e.message : String(e)}`,
      );
      errorCount++;
    }
  }

  logger.info(
    `Bulk CSV import complete: ${successCount} succeeded, ${errorCount} failed, ${skippedCount} skipped out of ${projectsToCreate.length} project(s)`,
  );

  return { successCount, errorCount, skippedCount };
}

/**
 * Options for createProjectAction (e.g. for testing with a mock fetch).
 *
 * @public
 */
export type CreateProjectActionOptions = {
  fetchApi?: { fetch: typeof fetch };
  hostProviderMap?: Map<string, ScmProviderName>;
};

/**
 * Creates an `x2a:project:create` Scaffolder action.
 *
 * This action creates a new project in the x2a database.
 *
 * @param discoveryApi - Backstage discovery service
 * @param config - Backstage root config (used to detect SCM providers from `integrations:` section)
 * @param options - Optional; use fetchApi to inject a custom fetch (e.g. in tests)
 * @public
 */
export function createProjectAction(
  discoveryApi: DiscoveryService,
  config: Config,
  options?: CreateProjectActionOptions,
) {
  const fetchApi = options?.fetchApi ?? { fetch };
  const hostProviderMap = options?.hostProviderMap ?? buildScmHostMap(config);

  return createTemplateAction({
    id: 'x2a:project:create',
    description: 'Create a new conversion project.',
    schema: {
      input: z =>
        z.discriminatedUnion('inputMethod', [
          z.object({
            inputMethod: z.literal('manual'),
            name: z.string({ description: 'The name of the project' }),
            description: z
              .string({ description: 'The description of the project' })
              .optional(),
            ownedByGroup: z
              .string({ description: 'The group that will own the project' })
              .optional(),
            sourceRepoUrl: z.string({
              description: 'The URL of the source repository',
            }),
            sourceRepoBranch: z.string({
              description: 'The branch of the source repository',
            }),
            areTargetAndSourceRepoShared: z.boolean({
              description:
                'Whether the target and source repositories are shared',
            }),
            targetRepoUrl: z
              .string({ description: 'The URL of the target repository' })
              .optional(),
            targetRepoBranch: z.string({
              description: 'The branch of the target repository',
            }),
            userPrompt: z
              .string({
                description: 'The user prompt for the project init phase',
              })
              .optional(),
            acceptedRuleIds: z
              .string({
                description: 'JSON-stringified array of accepted rule UUIDs',
              })
              .optional(),
            csvContent: z.string().optional(),
          }),
          z.object({
            inputMethod: z.literal('csv'),
            csvContent: z.string({
              description: 'Base64 data-URL encoded CSV file content',
            }),
            userPrompt: z
              .string({
                description: 'The user prompt for the project init phase',
              })
              .optional(),

            /*
            Workaround: Backstage converts the Zod schema to JSON Schema for validation and each discriminatedUnion
            variant becomes a sub-schema with additionalProperties: false.
            When the template passes all parameter keys (even undefined ones like name, sourceRepoUrl, etc. in CSV mode),
            the validator rejects the input because those keys aren't declared in the CSV variant.
            */
            githubRepoUrl: z.string().optional(),
            gitlabRepoUrl: z.string().optional(),
            bitbucketRepoUrl: z.string().optional(),

            name: z.string().optional(),
            description: z.string().optional(),
            ownedByGroup: z.string().optional(),
            sourceRepoUrl: z.string().optional(),
            sourceRepoBranch: z.string().optional(),
            areTargetAndSourceRepoShared: z.boolean().optional(),
            targetRepoUrl: z.string().optional(),
            targetRepoBranch: z.string().optional(),
            acceptedRuleIds: z.string().optional(),
          }),
        ]),
      output: {
        projectId: z =>
          z.string({ description: 'The ID of the created project' }),
        initJobId: z =>
          z.string({ description: 'The ID of the created init job' }),
        nextUrl: z =>
          z.string({
            description: 'The URL to the next step in the conversion process',
          }),
        successCount: z =>
          z.number({ description: 'The number of successful projects' }),
        errorCount: z =>
          z.number({ description: 'The number of failing projects' }),
        skippedCount: z =>
          z.number({
            description:
              'The number of projects skipped because they already exist',
          }),
      },
    },

    async handler(ctx) {
      ctx.logger.info(
        `Running x2a:project:create template action for ${ctx.user?.ref}`,
      );

      const token = ctx.secrets?.backstageToken;
      const api = new DefaultApiClient({ discoveryApi, fetchApi });
      const existingProjectNames = await fetchExistingProjectNames(api, token);

      if (ctx.input.inputMethod === 'manual') {
        const result = await handleManualCreation({
          input: ctx.input,
          secrets: ctx.secrets,
          api,
          token,
          existingProjectNames,
          hostProviderMap,
          logger: ctx.logger,
        });

        ctx.output('projectId', result.projectId);
        ctx.output('initJobId', result.initJobId);
        ctx.output('successCount', 1);
        ctx.output('skippedCount', 0);
        ctx.output('errorCount', 0);
        ctx.output('nextUrl', `/x2a/projects/${result.projectId}`);
      } else {
        const { successCount, errorCount, skippedCount } =
          await handleCsvBulkImport({
            csvContent: ctx.input.csvContent,
            secrets: ctx.secrets,
            api,
            token,
            existingProjectNames,
            hostProviderMap,
            userPrompt: ctx.input.userPrompt,
            logger: ctx.logger,
          });

        ctx.output('successCount', successCount);
        ctx.output('errorCount', errorCount);
        ctx.output('skippedCount', skippedCount);
        ctx.output('nextUrl', '/x2a/projects');

        if (errorCount > 0) {
          throw new Error(
            `CSV import completed with errors: ${successCount} succeeded, ${errorCount} failed, ${skippedCount} skipped out of ${successCount + errorCount + skippedCount} project(s)`,
          );
        }
      }
    },
  });
}
