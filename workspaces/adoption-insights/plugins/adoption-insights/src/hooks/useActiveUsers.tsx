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
import React from 'react';

import { useApi } from '@backstage/core-plugin-api';
import { useAsyncRetry } from 'react-use';
import { format } from 'date-fns';

import { ActiveUsersResponse } from '../types';
import { adoptionInsightsApiRef } from '../api';
import { useDateRange } from '../components/Header/DateRangeContext';
import { determineGrouping } from '../utils/utils';

export const useActiveUsers = (): {
  activeUsers: ActiveUsersResponse;
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = React.useState<boolean>(true);
  const [activeUsers, setActiveUsers] = React.useState<ActiveUsersResponse>({
    grouping: undefined,
    data: [],
  });

  const { startDateRange, endDateRange } = useDateRange();
  const grouping = determineGrouping(startDateRange, endDateRange);

  const api = useApi(adoptionInsightsApiRef);

  const getActiveUsers = React.useCallback(async () => {
    return await api
      .getActiveUsers({
        type: 'active_users',
        start_date: startDateRange
          ? format(startDateRange, 'yyyy-MM-dd')
          : undefined,
        end_date: endDateRange ? format(endDateRange, 'yyyy-MM-dd') : undefined,
        grouping,
      })
      .then(response =>
        setActiveUsers(response ?? { grouping: undefined, data: [] }),
      );
  }, [api, startDateRange, endDateRange, grouping]);

  const { error, loading } = useAsyncRetry(async () => {
    return await getActiveUsers();
  }, [getActiveUsers]);

  React.useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { activeUsers, error, loading: loadingData };
};
