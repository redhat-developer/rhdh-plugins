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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  resolveScmProvider,
  parseCsvContent,
  ScmProvider,
  SCAFFOLDER_SECRET_PREFIX,
  type AuthToken,
  type AuthTokenDescriptor,
  type ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export type ProviderAuthStatus = 'pending' | 'authenticated' | 'error';

export type ProviderRow = {
  provider: ScmProvider;
  readOnly: boolean;
  scope: string | string[];
  status: ProviderAuthStatus;
  error?: string;
};

interface UseProviderAuthParams {
  csvContent: string | undefined;
  hostProviderMap: Map<string, ScmProviderName>;
  authenticate: (
    descriptors: AuthTokenDescriptor[],
  ) => Promise<Array<AuthToken>>;
  onChange: (value: string | undefined) => void;
  secrets: Record<string, string>;
  setSecrets: (secrets: Record<string, string>) => void;
}

export function useProviderAuth({
  csvContent,
  hostProviderMap,
  authenticate,
  onChange,
  secrets,
  setSecrets,
}: UseProviderAuthParams) {
  const [providerStatuses, setProviderStatuses] = useState<
    Record<string, ProviderAuthStatus>
  >({});
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>(
    {},
  );
  const [isDone, setDone] = useState(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const authenticateRef = useRef(authenticate);
  authenticateRef.current = authenticate;
  const secretsRef = useRef(secrets);
  secretsRef.current = secrets;
  const providerTokensRef = useRef<Record<string, string>>({});
  const prevCsvRef = useRef(csvContent);

  // Ref-based flag: locks out auto-auth after any provider fails during
  // the initial run. Using a ref (not state) avoids re-triggering the
  // auto-auth effect and cancelling other in-flight provider auths.
  const initialAuthFailedRef = useRef(false);

  // Bumped on every CSV change and on unmount so stale async results
  // (from auto-auth or retry) are silently discarded.
  const authGenerationRef = useRef(0);

  const { distinctTargetProviders, distinctSourceProviders, parseError } =
    useMemo(() => {
      if (!csvContent) {
        return {
          distinctTargetProviders: [] as ScmProvider[],
          distinctSourceProviders: [] as ScmProvider[],
          parseError: undefined,
        };
      }

      try {
        const projectsToCreate = parseCsvContent(csvContent);

        const allTargetProviders: ScmProvider[] = projectsToCreate.map(
          project => resolveScmProvider(project.targetRepoUrl, hostProviderMap),
        );
        const allSourceProviders: ScmProvider[] = projectsToCreate.map(
          project => resolveScmProvider(project.sourceRepoUrl, hostProviderMap),
        );
        const targets = allTargetProviders.filter(
          (p, i, arr) => arr.findIndex(q => q.name === p.name) === i,
        );
        const sources = allSourceProviders.filter(
          (p, i, arr) =>
            arr.findIndex(q => q.name === p.name) === i &&
            !targets.some(t => t.name === p.name),
        );
        return {
          distinctTargetProviders: targets,
          distinctSourceProviders: sources,
          parseError: undefined,
        };
      } catch (e) {
        return {
          distinctTargetProviders: [] as ScmProvider[],
          distinctSourceProviders: [] as ScmProvider[],
          parseError: e instanceof Error ? e.message : 'Unknown error',
        };
      }
    }, [csvContent, hostProviderMap]);

  const providerRows: ProviderRow[] = useMemo(() => {
    const rows: ProviderRow[] = [];
    for (const p of distinctTargetProviders) {
      const desc = p.getAuthTokenDescriptor(false);
      rows.push({
        provider: p,
        readOnly: false,
        scope: desc.scope ?? '',
        status: providerStatuses[p.name] ?? 'pending',
        error: providerErrors[p.name],
      });
    }
    for (const p of distinctSourceProviders) {
      const desc = p.getAuthTokenDescriptor(true);
      rows.push({
        provider: p,
        readOnly: true,
        scope: desc.scope ?? '',
        status: providerStatuses[p.name] ?? 'pending',
        error: providerErrors[p.name],
      });
    }
    return rows;
  }, [
    distinctTargetProviders,
    distinctSourceProviders,
    providerStatuses,
    providerErrors,
  ]);

  // Reset all auth state when CSV content changes.
  useEffect(() => {
    if (csvContent !== prevCsvRef.current) {
      prevCsvRef.current = csvContent;
      authGenerationRef.current++;
      initialAuthFailedRef.current = false;
      setDone(false);
      setProviderStatuses({});
      setProviderErrors({});
      providerTokensRef.current = {};
      onChangeRef.current(undefined);
    }
  }, [csvContent]);

  // Auto-authenticate all providers on first render or CSV change.
  useEffect(() => {
    if (!csvContent || initialAuthFailedRef.current || isDone || parseError) {
      return undefined;
    }

    const targets = distinctTargetProviders;
    const sources = distinctSourceProviders;
    const allDistinctProviders = [...targets, ...sources];

    if (allDistinctProviders.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const doAuthAsync = async () => {
      const authenticateProvider = async (
        provider: ScmProvider,
        readOnly: boolean,
      ) => {
        try {
          const tokens = await authenticateRef.current([
            provider.getAuthTokenDescriptor(readOnly),
          ]);
          if (cancelled) return;

          providerTokensRef.current[
            `${SCAFFOLDER_SECRET_PREFIX}${provider.name}`
          ] = tokens[0].token;
          setProviderStatuses(prev => ({
            ...prev,
            [provider.name]: 'authenticated',
          }));
        } catch (e) {
          if (cancelled) return;

          setProviderStatuses(prev => ({
            ...prev,
            [provider.name]: 'error',
          }));
          setProviderErrors(prev => ({
            ...prev,
            [provider.name]: e instanceof Error ? e.message : 'Unknown error',
          }));
          initialAuthFailedRef.current = true;
        }
      };

      await Promise.all([
        ...targets.map(p => authenticateProvider(p, false)),
        ...sources.map(p => authenticateProvider(p, true)),
      ]);

      if (cancelled) return;

      const tokenCount = Object.keys(providerTokensRef.current).length;
      if (tokenCount !== allDistinctProviders.length) {
        onChangeRef.current(undefined);
      }
    };

    doAuthAsync();

    return () => {
      cancelled = true;
    };
    // csvContent is the meaningful trigger for re-authentication.
    // distinctTarget/SourceProviders are derived from it and captured above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvContent, isDone, parseError]);

  // Complete: all providers authenticated → set secrets and notify parent.
  useEffect(() => {
    if (isDone || providerRows.length === 0) return;
    if (!providerRows.every(r => r.status === 'authenticated')) return;

    onChangeRef.current('authenticated');
    setDone(true);
    setSecrets({
      ...secretsRef.current,
      ...providerTokensRef.current,
    });
  }, [providerRows, isDone, setSecrets]);

  const retryProvider = useCallback(
    async (provider: ScmProvider, readOnly: boolean) => {
      const generation = authGenerationRef.current;

      setProviderStatuses(prev => ({
        ...prev,
        [provider.name]: 'pending',
      }));
      setProviderErrors(prev => {
        const { [provider.name]: _, ...rest } = prev;
        return rest;
      });

      try {
        const tokens = await authenticateRef.current([
          provider.getAuthTokenDescriptor(readOnly),
        ]);

        if (generation !== authGenerationRef.current) return;

        providerTokensRef.current[
          `${SCAFFOLDER_SECRET_PREFIX}${provider.name}`
        ] = tokens[0].token;
        setProviderStatuses(prev => ({
          ...prev,
          [provider.name]: 'authenticated',
        }));
      } catch (e) {
        if (generation !== authGenerationRef.current) return;

        setProviderStatuses(prev => ({
          ...prev,
          [provider.name]: 'error',
        }));
        setProviderErrors(prev => ({
          ...prev,
          [provider.name]: e instanceof Error ? e.message : 'Unknown error',
        }));
      }
    },
    [],
  );

  return { providerRows, retryProvider, parseError };
}
