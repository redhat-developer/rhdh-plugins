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
import { useApiHolder } from '@backstage/core-plugin-api';
import { notificationsApiRef } from '@backstage/plugin-notifications';
import { useSignal } from '@backstage/plugin-signals-react';
import { NotificationSignal } from '@backstage/plugin-notifications-common';

export const useNotificationCount = () => {
  const apiHolder = useApiHolder();
  const { lastSignal } = useSignal<NotificationSignal>('notifications');
  const [available, setAvailable] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const notificationsApi = apiHolder.get(notificationsApiRef);
    if (!notificationsApi) {
      return;
    }
    if (!available) {
      setAvailable(true);
    }

    const fetchUnreadCount = async () => {
      try {
        const { notifications } = await notificationsApi.getNotifications({
          read: false,
        });
        setUnreadCount(notifications.length);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch unread notifications:', error);
      }
    };

    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiHolder]);

  useEffect(() => {
    if (!lastSignal) return;

    switch (lastSignal.action) {
      case 'notification_read':
        setUnreadCount(prev =>
          Math.max(0, prev - lastSignal.notification_ids.length),
        );
        break;
      case 'notification_unread':
        setUnreadCount(prev => prev + lastSignal.notification_ids.length);
        break;
      case 'new_notification':
        setUnreadCount(prev => prev + 1);
        break;
      default:
        break;
    }
  }, [lastSignal]);

  return { available, unreadCount };
};
