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
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi, discoveryApiRef } from '@backstage/core-plugin-api';

/**
 * Matches /x2a/download/* and forwards the wildcard path to /api/x2a/static/*.
 */
export const DownloadStaticPublicFile = () => {
  const { '*': filePath } = useParams();
  const discoveryApi = useApi(discoveryApiRef);

  useEffect(() => {
    if (!filePath) return;
    discoveryApi.getBaseUrl('x2a').then(baseUrl => {
      globalThis.location.href = `${baseUrl}/static/${filePath}`;
    });
  }, [discoveryApi, filePath]);

  return null;
};
