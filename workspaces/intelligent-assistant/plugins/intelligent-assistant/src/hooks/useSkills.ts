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

import { useApi } from '@backstage/core-plugin-api';

import { useQuery } from '@tanstack/react-query';

import { lightspeedApiRef } from '../api/api';
import { Skill } from '../types';
import { useIaSkillsPermission } from './useIaSkillsPermission';

export const useSkills = (
  enabled: boolean,
): {
  skills: Skill[];
  loading: boolean;
  error: Error | null;
  denied: boolean;
} => {
  const api = useApi(lightspeedApiRef);
  const permission = useIaSkillsPermission();
  const allowed = !permission.loading && permission.allowed;
  const query = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.getSkills(),
    enabled: enabled && allowed,
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const denied =
    (!permission.loading && !permission.allowed) ||
    (query.error !== null &&
      'status' in query.error &&
      query.error.status === 403);

  return {
    skills: allowed && !query.error ? (query.data ?? []) : [],
    loading: permission.loading || query.isLoading,
    error: query.error,
    denied,
  };
};
