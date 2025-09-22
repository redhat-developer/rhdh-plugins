/*
 * Copyright The Backstage Authors
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

import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { catalogModuleExtensions } from './module';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { dynamicPluginsFeatureLoader } from '@backstage/backend-dynamic-feature-service';
import type { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';

describe('catalogModuleExtensions', () => {
  it('should register the extension point', async () => {
    const runner = jest.fn();
    let usedSchedule: SchedulerServiceTaskScheduleDefinition | undefined;
    const scheduler = mockServices.scheduler.mock({
      createScheduledTaskRunner(schedule) {
        usedSchedule = schedule;
        return { run: runner };
      },
    });

    const extensionPoint = {
      addProcessor: jest.fn(),
      addEntityProvider: jest.fn(),
    };
    await startTestBackend({
      extensionPoints: [[catalogProcessingExtensionPoint, extensionPoint]],
      features: [
        catalogModuleExtensions,
        dynamicPluginsFeatureLoader(),
        scheduler.factory,
      ],
    });

    expect(extensionPoint.addProcessor).toHaveBeenCalledTimes(6);
    expect(extensionPoint.addEntityProvider).toHaveBeenCalledTimes(2);
    expect(usedSchedule?.frequency).toEqual({ minutes: 30 });
    expect(usedSchedule?.timeout).toEqual({ minutes: 10 });
  });
});
