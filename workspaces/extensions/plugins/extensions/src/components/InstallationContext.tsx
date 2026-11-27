/*
 * Copyright The Backstage Authors
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
  useMemo,
  useState,
} from 'react';

import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { extensionsTranslationRef } from '../alpha/translations';

/** Structured pending restart action; display copy is derived separately. */
export type PendingInstallationAction =
  | 'enable'
  | 'disable'
  | 'install'
  | 'update';

export type InstallationType = {
  [pluginName: string]: PendingInstallationAction;
};

/** Infer enable/disable UI state from a pending restart action. */
export const inferEnabledFromPending = (
  pending?: PendingInstallationAction,
): boolean | undefined => {
  if (pending === 'enable') {
    return true;
  }
  if (pending === 'disable') {
    return false;
  }
  return undefined;
};

/** Resolve a pending action by canonical key, then any alias keys. */
export const getPendingInstallationAction = (
  pending: InstallationType,
  canonicalKey: string,
  aliasKeys: readonly string[] = [],
): PendingInstallationAction | undefined => {
  if (canonicalKey && pending[canonicalKey]) {
    return pending[canonicalKey];
  }
  for (const alias of aliasKeys) {
    if (alias && pending[alias]) {
      return pending[alias];
    }
  }
  return undefined;
};

/** Localized label for a pending restart action (dialog / alerts). */
export const getPendingInstallationLabel = (
  action: PendingInstallationAction,
  kind: 'plugin' | 'package',
  t: TranslationFunction<typeof extensionsTranslationRef.T>,
): string => {
  switch (action) {
    case 'enable':
      return kind === 'package'
        ? t('install.packageEnabled')
        : t('install.pluginEnabled');
    case 'disable':
      return kind === 'package'
        ? t('install.packageDisabled')
        : t('install.pluginDisabled');
    case 'install':
      return t('install.pluginInstalled');
    case 'update':
      return kind === 'package'
        ? t('install.packageUpdated')
        : t('install.pluginUpdated');
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
};

/** Remove a pending-restart entry; returns the same object if the key is absent. */
export const withoutInstallationEntry = (
  current: InstallationType,
  key: string,
): InstallationType => {
  if (!(key in current)) {
    return current;
  }
  const { [key]: _removed, ...rest } = current;
  return rest;
};

/**
 * Canonical pending-restart key for a package — the human-readable name shown
 * in the restart dialog (matches the Installed packages Name column).
 */
export const getPackageInstallationKey = (pkg: {
  displayName?: string;
  title?: string;
  name?: string;
}): string => pkg.title ?? pkg.displayName ?? pkg.name ?? '';

const omitAliasKeys = (
  current: InstallationType,
  canonicalKey: string,
  aliasKeys: readonly string[],
): InstallationType => {
  let next = current;
  for (const alias of aliasKeys) {
    if (alias && alias !== canonicalKey && alias in next) {
      next = withoutInstallationEntry(next, alias);
    }
  }
  return next;
};

/**
 * Set a pending package restart under the canonical display key, dropping any
 * alias keys (npm package name, entity name) so one package is not listed twice.
 */
export const withPackageInstallationEntry = (
  current: InstallationType,
  canonicalKey: string,
  action: PendingInstallationAction,
  aliasKeys: readonly string[] = [],
): InstallationType =>
  omitAliasKeys(
    { ...current, [canonicalKey]: action },
    canonicalKey,
    aliasKeys,
  );

/** Clear a pending package restart, including any alias keys for the same package. */
export const withoutPackageInstallationEntry = (
  current: InstallationType,
  canonicalKey: string,
  aliasKeys: readonly string[] = [],
): InstallationType =>
  omitAliasKeys(
    withoutInstallationEntry(current, canonicalKey),
    canonicalKey,
    aliasKeys,
  );

type InstallationContextType = {
  installedPlugins: InstallationType;
  installedPackages: InstallationType;
  setInstalledPackages: (plugins: InstallationType) => void;
  setInstalledPlugins: (plugins: InstallationType) => void;
};

type InstallationStore = {
  plugins: InstallationType;
  packages: InstallationType;
};

const STORE_KEY = '__rhdhExtensionsInstallation';

const getStore = (): InstallationStore => {
  const globalState = globalThis as typeof globalThis & {
    [STORE_KEY]?: InstallationStore;
  };
  if (!globalState[STORE_KEY]) {
    globalState[STORE_KEY] = { plugins: {}, packages: {} };
  }
  return globalState[STORE_KEY];
};

/** @internal test-only helper to avoid leaking pending-restart state between tests */
export const resetInstallationStore = () => {
  const globalState = globalThis as typeof globalThis & {
    [STORE_KEY]?: InstallationStore;
  };
  globalState[STORE_KEY] = { plugins: {}, packages: {} };
};

export const InstallationContext = createContext<InstallationContextType>({
  installedPlugins: {},
  installedPackages: {},
  setInstalledPackages: () => {},
  setInstalledPlugins: () => {},
});

export const useInstallationContext = () => useContext(InstallationContext);

export const InstallationContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const store = getStore();
  const [installedPlugins, setInstalledPluginsState] =
    useState<InstallationType>(() => store.plugins);
  const [installedPackages, setInstalledPackagesState] =
    useState<InstallationType>(() => store.packages);

  const setInstalledPlugins = useCallback((plugins: InstallationType) => {
    getStore().plugins = plugins;
    setInstalledPluginsState(plugins);
  }, []);

  const setInstalledPackages = useCallback((packages: InstallationType) => {
    getStore().packages = packages;
    setInstalledPackagesState(packages);
  }, []);

  const installationContexttProviderValue = useMemo(
    () => ({
      installedPlugins,
      installedPackages,
      setInstalledPackages,
      setInstalledPlugins,
    }),
    [
      installedPlugins,
      installedPackages,
      setInstalledPlugins,
      setInstalledPackages,
    ],
  );
  return (
    <InstallationContext.Provider value={installationContexttProviderValue}>
      {children}
    </InstallationContext.Provider>
  );
};
