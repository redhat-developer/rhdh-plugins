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
export {
  konfluxPlugin,
  KonfluxLatestReleases,
  KonfluxStatus,
  KonfluxPage,
  KonfluxCIPage,
} from './plugin';

/** @public */
export { KonfluxCIPageComponent } from './components/KonfluxCIPage/KonfluxCIPage';
/** @public */
export { KonfluxPageComponent } from './components/KonfluxPage/KonfluxPage';

/** @public */
export const isKonfluxOverviewAvailable = (entity: any) => {
  return entity?.metadata?.annotations?.['konflux-ci.dev/overview'] === 'true';
};

/** @public */
export const isKonfluxCiTabAvailable = (entity: any) => {
  return entity?.metadata?.annotations?.['konflux-ci.dev/ci'] === 'true';
};

/** @public */
export const isKonfluxTabAvailable = (entity: any) => {
  return entity?.metadata?.annotations?.['konflux-ci.dev/konflux'] === 'true';
};
