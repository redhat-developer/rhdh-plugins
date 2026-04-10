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

import { createApiRef, type ApiRef } from '@backstage/core-plugin-api';

import { NotebookSession } from '../types';

/**
 * @public
 * AI Notebooks API
 */
export type NotebooksAPI = {
  listSessions: () => Promise<NotebookSession[]>;
  renameSession: (sessionId: string, name: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
};

/**
 * @public
 * AI Notebooks API interface
 */
export const notebooksApiRef: ApiRef<NotebooksAPI> = createApiRef<NotebooksAPI>(
  {
    id: 'plugin.lightspeed.notebooks.service',
  },
);
