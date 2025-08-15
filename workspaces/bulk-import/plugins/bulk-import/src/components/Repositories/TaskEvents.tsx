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
import { useEffect, useState } from 'react';

import { useApi } from '@backstage/core-plugin-api';

import LinearProgress from '@mui/material/LinearProgress';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';

export const TaskEvents = ({ taskId }: { taskId: string }) => {
  const api = useApi(bulkImportApiRef);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let eventSource: EventSource;

    const fetchEvents = async () => {
      eventSource = await api.getScaffolderTaskEvents(taskId);

      setLoading(false);
      eventSource.addEventListener('log', (event: MessageEvent) => {
        const eventData = JSON.parse(event.data);
        setEvents(prevEvents => [...prevEvents, eventData]);
      });

      eventSource.addEventListener('completion', (event: MessageEvent) => {
        const eventData = JSON.parse(event.data);
        setEvents(prevEvents => [...prevEvents, eventData]);
        eventSource.close();
      });

      eventSource.onerror = () => {
        setLoading(false);
        eventSource.close();
      };
    };

    fetchEvents();

    return () => {
      eventSource?.close();
    };
  }, [api, taskId]);

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <div>
      <h3>Events for task {taskId}</h3>
      <pre>
        {events.map((e, i) => (
          <div key={i}>{JSON.stringify(e, null, 2)}</div>
        ))}
      </pre>
    </div>
  );
};
