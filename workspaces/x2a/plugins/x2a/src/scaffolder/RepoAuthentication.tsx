/**
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
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { useEffect, useRef, useState } from 'react';

import {
  type CustomFieldValidator,
  FieldExtensionComponentProps,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import {
  resolveScmProvider,
  parseCsvContent,
  ScmProvider,
  SCAFFOLDER_SECRET_PREFIX,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Button, Typography } from '@material-ui/core';

import { useScmHostMap } from '../hooks/useScmHostMap';
import { useRepoAuthentication } from '../repoAuth';

/**
 * RepoAuthentication extension requests authentication tokens for all the SCM providers
 * listed in the CSV bulk project import and stores them among scaffolder secrets.
 *
 * @public
 */
export const RepoAuthentication = ({
  onChange,
  formContext,
  uiSchema,
  schema,
}: FieldExtensionComponentProps<string>) => {
  const hostProviderMap = useScmHostMap();
  const { secrets, setSecrets } = useTemplateSecrets();
  const repoAuthentication = useRepoAuthentication();
  const [error, setError] = useState<string | undefined>();
  const [suppressDialog, setSuppressDialog] = useState(false);
  const [isDone, setDone] = useState(false);

  const secretsRef = useRef(secrets);
  secretsRef.current = secrets;

  const { title, description } = schema;
  const csvFieldName =
    (uiSchema?.['ui:options']?.csvFieldName as string) || undefined;
  const csvContent = csvFieldName
    ? formContext?.formData?.[csvFieldName]
    : undefined;

  const prevCsvRef = useRef(csvContent);

  useEffect(() => {
    if (csvContent !== prevCsvRef.current) {
      prevCsvRef.current = csvContent;
      setDone(false);
      setSuppressDialog(false);
      setError(undefined);
      onChange(undefined);
    }
  }, [csvContent, onChange]);

  useEffect(() => {
    if (!csvContent || suppressDialog || isDone) {
      return undefined;
    }

    setError(undefined);

    let projectsToCreate;
    try {
      projectsToCreate = parseCsvContent(csvContent);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return undefined;
    }

    const allTargetProviders: ScmProvider[] = projectsToCreate.map(project =>
      resolveScmProvider(project.targetRepoUrl, hostProviderMap),
    );
    const allSourceProviders: ScmProvider[] = projectsToCreate.map(project =>
      resolveScmProvider(project.sourceRepoUrl, hostProviderMap),
    );
    const distinctTargetProviders = allTargetProviders.filter(
      (p, i, arr) => arr.findIndex(q => q.name === p.name) === i,
    );
    const distinctSourceProviders = allSourceProviders.filter(
      (p, i, arr) =>
        arr.findIndex(q => q.name === p.name) === i &&
        !distinctTargetProviders.some(t => t.name === p.name),
    );
    const allDistinctProviders = [
      ...distinctTargetProviders,
      ...distinctSourceProviders,
    ];

    let cancelled = false;
    const authCsvSnapshot = csvContent;

    const doAuthAsync = async () => {
      const providerTokens = new Map<string, string>();

      const authenticateProvider = async (
        provider: ScmProvider,
        readOnly: boolean,
      ) => {
        try {
          const tokens = await repoAuthentication.authenticate([
            provider.getAuthTokenDescriptor(readOnly),
          ]);
          if (cancelled) {
            return;
          }
          providerTokens.set(
            `${SCAFFOLDER_SECRET_PREFIX}${provider.name}`,
            tokens[0].token,
          );
        } catch (e) {
          if (cancelled) {
            return;
          }
          setError(e instanceof Error ? e.message : 'Unknown error');
          setSuppressDialog(true);
        }
      };

      await Promise.all([
        ...distinctTargetProviders.map(p => authenticateProvider(p, false)),
        ...distinctSourceProviders.map(p => authenticateProvider(p, true)),
      ]);

      if (
        cancelled ||
        authCsvSnapshot !== prevCsvRef.current ||
        providerTokens.size !== allDistinctProviders.length
      ) {
        if (
          !cancelled &&
          authCsvSnapshot === prevCsvRef.current &&
          providerTokens.size !== allDistinctProviders.length
        ) {
          onChange(undefined);
        }
        return;
      }

      onChange('authenticated');
      setDone(true);
      setSecrets({
        ...secretsRef.current,
        ...Object.fromEntries(providerTokens),
      });
    };

    doAuthAsync();

    return () => {
      cancelled = true;
    };
  }, [
    csvContent,
    hostProviderMap,
    repoAuthentication,
    setSecrets,
    suppressDialog,
    isDone,
    onChange,
  ]);

  return (
    <>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body1">{description}</Typography>
      {suppressDialog && !isDone && (
        <Typography variant="body1">
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSuppressDialog(false);
              setError(undefined);
            }}
          >
            Try again
          </Button>
        </Typography>
      )}
      {!csvFieldName && (
        <Typography variant="body1" color="error">
          CSV field name is required for RepoAuthentication extension
        </Typography>
      )}
      {!csvContent && (
        <Typography variant="body1" color="error">
          CSV content is required for RepoAuthentication extension
        </Typography>
      )}
      {error && (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      )}
    </>
  );
};

/**
 * Validation function for the RepoAuthentication scaffolder field extension.
 * Blocks wizard progression until all SCM providers are authenticated.
 *
 * @public
 */
export const repoAuthenticationValidation: CustomFieldValidator<string> = (
  data,
  field,
) => {
  if (!data) {
    field.addError(
      'Authentication with all SCM providers is required before proceeding',
    );
  }
};
