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

import { RegisterAComponentSection } from '../components/HeaderDropdownComponent/RegisterAComponentSection';
import { SoftwareTemplatesSection } from '../components/HeaderDropdownComponent/SoftwareTemplatesSection';
import {
  ComponentType,
  CreateDropdownMountPoint,
  ScalprumState,
} from '../types';
import { useScalprum } from '@scalprum/react-core';

export const useCreateDropdownMountPoints = ():
  | CreateDropdownMountPoint[]
  | undefined => {
  const scalprum = useScalprum<ScalprumState>();

  const createDropdownMountPoints =
    scalprum?.api?.dynamicRootConfig?.mountPoints?.['global.header/create'];

  // default profile dropdown components for dev env
  if (Object.keys(scalprum?.api || {}).length === 0) {
    return [
      {
        Component: SoftwareTemplatesSection as React.ComponentType,
        config: {
          type: ComponentType.LIST,
          priority: 10,
        },
      },
      {
        Component: RegisterAComponentSection as React.ComponentType,
        config: {
          type: ComponentType.LINK,
          priority: 0,
        },
      },
    ];
  }

  return createDropdownMountPoints ?? [];
};
