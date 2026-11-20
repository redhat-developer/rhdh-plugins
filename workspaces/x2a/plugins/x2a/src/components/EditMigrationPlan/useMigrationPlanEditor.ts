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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MIGRATION_PLAN_MAX_CONTENT_BYTES,
  Module,
  Project,
  resolveScmProvider,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useClientService } from '../../ClientService';
import { useProjectWriteAccess } from '../../hooks/useProjectWriteAccess';
import { useScmHostMap } from '../../hooks/useScmHostMap';
import { useTranslation } from '../../hooks/useTranslation';
import { useRepoAuthentication } from '../../repoAuth';
import { extractResponseError, isHttpSuccessResponse } from '../tools';

export type EditorStatus =
  /** Loading the project (and module). */
  | 'loadingContext'
  /** The user may not edit this project. */
  | 'forbidden'
  /** The repository's provider does not support direct writes. */
  | 'unsupported'
  /** An SCM access token could not be obtained silently; the user needs to authorize. */
  | 'authorize'
  | 'loadingDocument'
  | 'ready'
  /** The project or the document could not be loaded. */
  | 'failed';

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

const byteLength = (s: string): number => new Blob([s]).size;

/**
 * State machine behind the migration plan editor page: loads the project, makes
 * sure the user may edit it, obtains the SCM token, reads and saves the document.
 */
export const useMigrationPlanEditor = ({
  projectId,
  moduleId,
}: {
  projectId: string;
  moduleId?: string;
}) => {
  const { t } = useTranslation();
  const clientService = useClientService();
  const { authenticate } = useRepoAuthentication();
  const hostMap = useScmHostMap();
  const { loading: accessLoading, canWriteProject } = useProjectWriteAccess();

  const [project, setProject] = useState<Project>();
  const [module, setModule] = useState<Module>();
  const [status, setStatus] = useState<EditorStatus>('loadingContext');
  const [loadError, setLoadError] = useState<string>();
  const [authError, setAuthError] = useState<string>();
  const [original, setOriginal] = useState({ content: '', version: '' });
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const startedRef = useRef(false);

  const provider = useMemo(
    () =>
      project ? resolveScmProvider(project.targetRepoUrl, hostMap) : undefined,
    [project, hostMap],
  );

  const getToken = useCallback(async (): Promise<string> => {
    const [authToken] = await authenticate([
      provider!.getContentWriteAuthTokenDescriptor(),
    ]);
    return authToken.token;
  }, [authenticate, provider]);

  const providerLabel = provider
    ? { github: 'GitHub', gitlab: 'GitLab', bitbucket: 'Bitbucket' }[
        provider.name
      ]
    : '';

  const loadDocument = useCallback(async () => {
    setLoadError(undefined);
    setAuthError(undefined);
    setSaveError(undefined);
    setSaved(false);
    setStatus('loadingDocument');

    let token: string;
    try {
      token = await getToken();
    } catch (e) {
      setAuthError(
        t('editMigrationPlan.authorize.error' as any, {
          provider: providerLabel,
          message: errorMessage(e),
        }),
      );
      setStatus('authorize');
      return;
    }

    try {
      const body = { targetRepoAuth: { token } };
      const response = moduleId
        ? await clientService.projectsProjectIdModulesModuleIdMigrationPlanReadPost(
            { path: { projectId, moduleId }, body },
          )
        : await clientService.projectsProjectIdMigrationPlanReadPost({
            path: { projectId },
            body,
          });
      if (!isHttpSuccessResponse(response)) {
        const message = await extractResponseError(
          response,
          t('editMigrationPlan.loadError'),
        );
        if (response.status === 401) {
          setAuthError(message);
          setStatus('authorize');
        } else {
          setLoadError(message);
          setStatus('failed');
        }
        return;
      }
      const document = await response.json();
      setOriginal(document);
      setContent(document.content);
      setStatus('ready');
    } catch (e) {
      setLoadError(errorMessage(e));
      setStatus('failed');
    }
  }, [clientService, getToken, moduleId, projectId, providerLabel, t]);

  // Load the project and the module
  useEffect(() => {
    let cancelled = false;
    startedRef.current = false;
    void (async () => {
      try {
        const projectResponse = await clientService.projectsProjectIdGet({
          path: { projectId },
        });
        if (!isHttpSuccessResponse(projectResponse)) {
          throw new Error(
            await extractResponseError(
              projectResponse,
              t('editMigrationPlan.loadError'),
            ),
          );
        }
        const loadedProject = await projectResponse.json();

        let loadedModule: Module | undefined;
        if (moduleId) {
          const moduleResponse =
            await clientService.projectsProjectIdModulesModuleIdGet({
              path: { projectId, moduleId },
            });
          if (!isHttpSuccessResponse(moduleResponse)) {
            throw new Error(
              await extractResponseError(
                moduleResponse,
                t('editMigrationPlan.loadError'),
              ),
            );
          }
          loadedModule = await moduleResponse.json();
        }
        if (!cancelled) {
          setProject(loadedProject);
          setModule(loadedModule);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(errorMessage(e));
          setStatus('failed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // t is stable enough; reloading the context on language change is not wanted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientService, projectId, moduleId]);

  // Once the project and the user's permissions are known, decide whether and how to proceed
  useEffect(() => {
    if (!project || !provider || accessLoading || startedRef.current) {
      return;
    }
    startedRef.current = true;
    if (!canWriteProject(project)) {
      setStatus('forbidden');
    } else if (provider.name === 'bitbucket') {
      setStatus('unsupported');
    } else {
      void loadDocument();
    }
  }, [project, provider, accessLoading, canWriteProject, loadDocument]);

  const editContent = useCallback((value: string) => {
    setContent(value);
    setSaved(false);
  }, []);

  const save = useCallback(
    async (message: string): Promise<boolean> => {
      setSaving(true);
      setSaveError(undefined);
      setSaved(false);
      try {
        let token: string;
        try {
          token = await getToken();
        } catch (e) {
          setSaveError(
            t('editMigrationPlan.authorize.error' as any, {
              provider: providerLabel,
              message: errorMessage(e),
            }),
          );
          return false;
        }
        const body = {
          content,
          message,
          version: original.version,
          targetRepoAuth: { token },
        };
        const response = moduleId
          ? await clientService.projectsProjectIdModulesModuleIdMigrationPlanPut(
              { path: { projectId, moduleId }, body },
            )
          : await clientService.projectsProjectIdMigrationPlanPut({
              path: { projectId },
              body,
            });
        if (!isHttpSuccessResponse(response)) {
          setSaveError(
            await extractResponseError(
              response,
              t('editMigrationPlan.saveError'),
            ),
          );
          return false;
        }
        const result = await response.json();
        setOriginal({ content, version: result.version });
        setSaved(true);
        return true;
      } catch (e) {
        setSaveError(errorMessage(e));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      clientService,
      content,
      getToken,
      moduleId,
      original.version,
      projectId,
      providerLabel,
      t,
    ],
  );

  return {
    status,
    project,
    module,
    providerLabel,
    loadError,
    authError,
    content,
    editContent,
    dirty: content !== original.content,
    tooLarge: byteLength(content) > MIGRATION_PLAN_MAX_CONTENT_BYTES,
    saving,
    saveError,
    saved,
    /** Also the way to authorize: reading the document requests the token. */
    reload: loadDocument,
    save,
  };
};
