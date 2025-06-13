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

import { createContext, useContext, useMemo, useState } from 'react';

type DrawerContextType = {
  drawerData: any;
  setDrawerData: (data: any) => void;
  openDrawer: boolean;
  setOpenDrawer: (open: boolean) => void;
};

export const DrawerContext = createContext<DrawerContextType>({
  drawerData: {},
  setDrawerData: () => {},
  openDrawer: false,
  setOpenDrawer: () => {},
});

export const DrawerContextProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [drawerData, setDrawerData] = useState({});

  const drawerContextProviderValue = useMemo(
    () => ({
      openDrawer,
      setOpenDrawer,
      drawerData,
      setDrawerData,
    }),
    [openDrawer, setOpenDrawer, drawerData, setDrawerData],
  );
  return (
    <DrawerContext.Provider value={drawerContextProviderValue}>
      {children}
    </DrawerContext.Provider>
  );
};
export const useDrawer = () => useContext(DrawerContext);
