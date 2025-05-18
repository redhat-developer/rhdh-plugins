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
import { useNavigate } from 'react-router-dom';

import { useApi, useRouteRef } from '@backstage/core-plugin-api';

import { orchestratorApiRef } from '../api/api';
import { executeWorkflowRouteRef } from '../routes';

export const useHandleExecute = () => {
  const navigate = useNavigate();
  const orchestratorApi = useApi(orchestratorApiRef);
  const executeWorkflowLink = useRouteRef(executeWorkflowRouteRef);

  const handleExecute = async (
    workflowId: string,
    setIsBarOpen: (open: boolean) => void,
    url?: string,
  ) => {
    const workflowOverviewDTO =
      await orchestratorApi.getWorkflowOverview(workflowId);
    const isAvailable = workflowOverviewDTO?.data.isAvailable ?? false;
    if (isAvailable && url) navigate(url);
    else if (isAvailable) navigate(executeWorkflowLink({ workflowId }));
    else setIsBarOpen(true);
  };

  return { handleExecute };
};
