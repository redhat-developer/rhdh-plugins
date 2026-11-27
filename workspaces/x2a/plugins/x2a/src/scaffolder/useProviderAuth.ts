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
  extractHost,
  resolveScmProvider,
  parseCsvContent,
  ScmProvider,
  SCAFFOLDER_SECRET_PREFIX,
  type AuthToken,
  type ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { HostBoundTokenRequest } from '../repoAuth';

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
    requests: HostBoundTokenRequest[],
  ) => Promise<Array<AuthToken>>;
  onChange: (value: string | undefined) => void;
  secrets: Record<string, string>;
  setSecrets: (secrets: Record<string, string>) => void;
}

/**
 * Manages the full lifecycle of SCM provider authentication for a CSV import.
 *
 * Three effects divide the work:
 *  1. **Reset** - clears all auth state when csvContent changes.
 *  2. **Auto-auth** - fires one OAuth dialog per distinct provider.
 *     All providers authenticate concurrently via Promise.all.
 *     If any fail the user can retry them individually.
 *  3. **Completion** - once every provider row reaches "authenticated",
 *     stores tokens as scaffolder secrets and signals the parent form.
 *
 * Callbacks/props that change on every render (onChange, authenticate,
 * secrets) are kept in refs so the effects' dependency arrays stay
 * minimal and don't cause unwanted re-runs or cancellations.
 */
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

  // Refs for values that may change every render - used inside effects
  // and callbacks without adding them to dependency arrays.
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

  // Bumped on every CSV change so stale async results
  // (from auto-auth or retry) are silently discarded.
  const authGenerationRef = useRef(0);

  const {
    distinctTargetProviders,
    distinctSourceProviders,
    hostsByProvider,
    parseError,
  } = useMemo(() => {
    if (!csvContent) {
      return {
        distinctTargetProviders: [] as ScmProvider[],
        distinctSourceProviders: [] as ScmProvider[],
        hostsByProvider: {} as Record<string, string[]>,
        parseError: undefined,
      };
    }

    try {
      const projectsToCreate = parseCsvContent(csvContent);

      const allTargetProviders: ScmProvider[] = projectsToCreate.map(project =>
        resolveScmProvider(project.targetRepoUrl, hostProviderMap),
      );
      const allSourceProviders: ScmProvider[] = projectsToCreate.map(project =>
        resolveScmProvider(project.sourceRepoUrl, hostProviderMap),
      );
      // Deduplicate: targets get read-write access, sources that also
      // appear as targets are excluded (the read-write token covers both).
      const targets = allTargetProviders.filter(
        (p, i, arr) => arr.findIndex(q => q.name === p.name) === i,
      );
      const sources = allSourceProviders.filter(
        (p, i, arr) =>
          arr.findIndex(q => q.name === p.name) === i &&
          !targets.some(t => t.name === p.name),
      );

      // Collected from ALL rows, before the target/source dedupe above: one
      // token per provider is shared by every row, so each host the
      // provider is used with must be allowed to receive it.
      const collected: Record<string, string[]> = {};
      const addHost = (provider: ScmProvider, repoUrl: string) => {
        const host = extractHost(repoUrl) ?? '';
        const hosts = (collected[provider.name] ??= []);
        if (!hosts.includes(host)) hosts.push(host);
      };
      projectsToCreate.forEach((project, i) => {
        addHost(allTargetProviders[i], project.targetRepoUrl);
        addHost(allSourceProviders[i], project.sourceRepoUrl);
      });

      return {
        distinctTargetProviders: targets,
        distinctSourceProviders: sources,
        hostsByProvider: collected,
        parseError: undefined,
      };
    } catch (e) {
      return {
        distinctTargetProviders: [] as ScmProvider[],
        distinctSourceProviders: [] as ScmProvider[],
        hostsByProvider: {} as Record<string, string[]>,
        parseError: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }, [csvContent, hostProviderMap]);

  // One request per distinct host the provider is used with. The guard in
  // useRepoAuth rejects the whole provider if any of them is not the host its
  // OAuth provider is registered against, so the single token is only ever
  // used on that host.
  // Read through a ref because retryProvider is memoised with no deps.
  const hostsByProviderRef = useRef(hostsByProvider);
  hostsByProviderRef.current = hostsByProvider;
  const requestsFor = useCallback(
    (provider: ScmProvider, readOnly: boolean) =>
      (hostsByProviderRef.current[provider.name] ?? ['']).map(host => ({
        descriptor: provider.getAuthTokenDescriptor(readOnly),
        host,
      })),
    [],
  );

  // Build the provider rows for the table.
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

  // Effect: Reset
  // Clears all auth state when CSV content changes.  prevCsvRef lets us
  // distinguish a real CSV change from a no-op re-render with the same
  // value. The generation bump invalidates any in-flight retryProvider
  // calls that were started for the previous CSV.
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

  // Effect: Auto-auth
  // Fires one OAuth dialog per distinct provider, all concurrently.
  // If the effect re-runs the cleanup sets
  // `cancelled = true` so stale promises are discarded.
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

    // Guard flag set by the cleanup function below. React calls the
    // cleanup when this effect's dependencies change (e.g. csvContent)
    // or when the component unmounts. Any in-flight authenticate()
    // promises that settle after that point check this flag and skip
    // their state updates so we never write stale tokens/statuses.
    let cancelled = false;

    const doAuthAsync = async () => {
      const authenticateProvider = async (
        provider: ScmProvider,
        readOnly: boolean,
      ) => {
        try {
          const tokens = await authenticateRef.current(
            requestsFor(provider, readOnly),
          );
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
          // Mark via ref (not state) so we stop auto-auth on future
          // renders without re-triggering this effect's cleanup and
          // cancelling other providers still authenticating.
          initialAuthFailedRef.current = true;
        }
      };

      await Promise.all([
        ...targets.map(p => authenticateProvider(p, false)),
        ...sources.map(p => authenticateProvider(p, true)),
      ]);

      if (cancelled) return;

      // If some providers failed, signal incomplete auth to the parent
      // so the form validation blocks progression. The completion effect
      // will fire onChange('authenticated') once every row reaches 'authenticated'
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

  // Effect: Completion
  // Kept separate from auto-auth so that manual retries (retryProvider)
  // also trigger completion without duplicating the secret-storing logic.
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

  // Retry a single provider after a failure. The auto-auth effect is
  // not re-run but directly updates statuses/tokens and fires
  // the completion-effect. A captured generation counter guards
  // against staleness: if the input changes while a retry is in-flight,
  // the generation will have been bumped and the stale result is silently discarded.
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
        const tokens = await authenticateRef.current(
          requestsFor(provider, readOnly),
        );

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
    [requestsFor],
  );

  return { providerRows, retryProvider, parseError };
}
