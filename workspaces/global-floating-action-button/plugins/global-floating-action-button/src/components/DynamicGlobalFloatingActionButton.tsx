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

import { useFabMountPoints } from '../hooks/useFabMountPoints';
import { GlobalFloatingActionButton } from './GlobalFloatingActionButton';
import { FloatingActionButton } from '../types';

/**
 * Dynamic Global Floating Action Button
 *
 * @public
 */
export const DynamicGlobalFloatingActionButton = () => {
  const allFabMountPoints = useFabMountPoints();

  const floatingButtons = (allFabMountPoints || []).map(
    fab => fab?.config,
  ) as FloatingActionButton[];

  if (floatingButtons?.length === 0) {
    return null;
  }

  return <GlobalFloatingActionButton floatingButtons={floatingButtons} />;
};
