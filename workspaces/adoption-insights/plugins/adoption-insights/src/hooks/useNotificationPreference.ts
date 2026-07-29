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
import { useState, useCallback, useEffect } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { adoptionInsightsApiRef } from '../api';
import { NotificationFrequency } from '../types';

export const useNotificationPreference = () => {
  const [frequency, setFrequency] = useState<NotificationFrequency>('weekly');
  const [loading, setLoading] = useState(true);
  const api = useApi(adoptionInsightsApiRef);

  useEffect(() => {
    let mounted = true;
    api
      .getNotificationPreference()
      .then(response => {
        if (mounted) setFrequency(response.frequency);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [api]);

  const updateFrequency = useCallback(
    async (newFrequency: NotificationFrequency) => {
      setFrequency(newFrequency);
      await api.setNotificationPreference(newFrequency);
    },
    [api],
  );

  return { frequency, setFrequency: updateFrequency, loading };
};
