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

import { defaultProfileDropdownMountPoints } from '../defaultMountPoints/defaultMountPoints';
import { ProfileDropdownMountPoint, ScalprumState } from '../types';
import { useScalprum } from '@scalprum/react-core';

export const useProfileDropdownMountPoints = ():
  | ProfileDropdownMountPoint[]
  | undefined => {
  const scalprum = useScalprum<ScalprumState>();

  const profileDropdownMountPoints =
    scalprum?.api?.dynamicRootConfig?.mountPoints?.['global.header/profile'];

  // default profile dropdown components for dev env
  if (Object.keys(scalprum?.api || {}).length === 0) {
    return defaultProfileDropdownMountPoints;
  }

  return profileDropdownMountPoints ?? [];
};
