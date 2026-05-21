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

import { useMemo } from 'react';
import type { ChatAgentConfig } from '../types';
import { useAdminConfig } from './useAdminConfig';

/**
 * Loads the admin-curated chat agent configuration.
 * Returns the array of ChatAgentConfig entries and CRUD helpers.
 */
export function useChatAgentConfig() {
  const { entry, loading, saving, error, save, refresh } =
    useAdminConfig('chatAgents');

  const configs: ChatAgentConfig[] = useMemo(() => {
    if (!entry?.configValue) return [];
    if (Array.isArray(entry.configValue)) return entry.configValue;
    return [];
  }, [entry]);

  return { configs, loading, saving, error, save, refresh };
}
