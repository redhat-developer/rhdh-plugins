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

export type InstallationType = { [pluginName: string]: string };

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
  children: React.ReactElement;
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
