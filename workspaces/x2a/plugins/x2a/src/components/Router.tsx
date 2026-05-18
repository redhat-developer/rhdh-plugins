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
import { Route, Routes } from 'react-router-dom';

import { Dashboard } from './Dashboard';
import { DownloadStaticPublicFile } from './DownloadStaticPublicFile';
import { ModulePage } from './ModulePage';
import { RulesPage } from './RulesPage';
import {
  downloadRouteRef,
  moduleRouteRef,
  projectRouteRef,
  rulesRouteRef,
} from '../routes';
import { ProjectPage } from './ProjectPage';

export const Router = () => {
  return (
    // relative to x2a/
    <Routes>
      <Route
        path={`${downloadRouteRef.path}/*`}
        element={<DownloadStaticPublicFile />}
      />
      <Route path={moduleRouteRef.path} element={<ModulePage />} />
      <Route path={projectRouteRef.path} element={<ProjectPage />} />
      <Route path={rulesRouteRef.path} element={<RulesPage />} />
      <Route path="/*" element={<Dashboard />} />
    </Routes>
  );
};
