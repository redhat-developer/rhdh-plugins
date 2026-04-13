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
import { useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../api';
import { Workflow, QuickAction, PromptGroup } from '../types';
import { debugWarn } from '../utils';
import { useApiQuery } from './useApiQuery';

interface WelcomeDataResult {
  workflows: Workflow[];
  quickActions: QuickAction[];
  promptGroups: PromptGroup[];
}

const INITIAL_DATA: WelcomeDataResult = {
  workflows: [],
  quickActions: [],
  promptGroups: [],
};

/**
 * Fetches workflows, quick actions, and prompt groups on mount.
 * Used by ChatContainer to populate the welcome screen.
 * Uses Promise.allSettled so partial failures still return successful data.
 */
export function useWelcomeData() {
  const api = useApi(augmentApiRef);

  const fetcher = useCallback(async (): Promise<WelcomeDataResult> => {
    const [wfsResult, qasResult, pgsResult] = await Promise.allSettled([
      api.getWorkflows(),
      api.getQuickActions(),
      api.getPromptGroups(),
    ]);

    if (wfsResult.status === 'rejected') {
      debugWarn('Failed to load workflows:', wfsResult.reason);
    }
    if (qasResult.status === 'rejected') {
      debugWarn('Failed to load quick actions:', qasResult.reason);
    }
    if (pgsResult.status === 'rejected') {
      debugWarn('Failed to load prompt groups:', pgsResult.reason);
    }

    return {
      workflows: wfsResult.status === 'fulfilled' ? wfsResult.value : [],
      quickActions: qasResult.status === 'fulfilled' ? qasResult.value : [],
      promptGroups: pgsResult.status === 'fulfilled' ? pgsResult.value : [],
    };
  }, [api]);

  const { data } = useApiQuery<WelcomeDataResult>({
    fetcher,
    initialValue: INITIAL_DATA,
  });

  return data;
}
