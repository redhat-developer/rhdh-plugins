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
import { createContext, useContext, useMemo, useState } from 'react';

export type InstallationType = { [pluginName: string]: string };

type InstallationContextType = {
  installedPlugins: InstallationType;
  installedPackages: InstallationType;
  setInstalledPackages: (plugins: InstallationType) => void;
  setInstalledPlugins: (plugins: InstallationType) => void;
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
  const [installedPlugins, setInstalledPlugins] = useState<InstallationType>(
    {},
  );
  const [installedPackages, setInstalledPackages] = useState<InstallationType>(
    {},
  );

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
