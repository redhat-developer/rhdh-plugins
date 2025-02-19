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
import {
  AlertApi,
  AnalyticsApi,
  AnalyticsEvent,
} from '@backstage/core-plugin-api';

import {
  AnalyticsApi as NewAnalyticsApi,
  AnalyticsEvent as NewAnalyticsEvent,
} from '@backstage/frontend-plugin-api';

/**
 * @public
 */
export class AlertApiAnalyticsApi implements AnalyticsApi, NewAnalyticsApi {
  constructor(private alertApi: AlertApi) {}

  captureEvent(event: AnalyticsEvent | NewAnalyticsEvent) {
    this.alertApi.post({
      message: `${event.action} ${event.subject}`,
      display: 'transient',
    });
  }
}
