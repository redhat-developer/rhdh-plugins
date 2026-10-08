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

import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import {
  WorkflowLogProvider,
  workflowLogsExtensionEndpoint,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-node';

import { orchestratorModuleLoki } from './module';

describe('orchestratorModuleLoki', () => {
  it('registers the Loki workflow log provider on the extension point', async () => {
    const extensionPoint = {
      addWorkflowLogProvider: jest.fn(),
    };

    await startTestBackend({
      extensionPoints: [[workflowLogsExtensionEndpoint, extensionPoint]],
      features: [
        orchestratorModuleLoki,
        mockServices.rootConfig.factory({
          data: {
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'http://localhost:3100',
                  token: 'test-token',
                  allowInsecureHttp: true,
                },
              },
            },
          },
        }),
      ],
    });

    expect(extensionPoint.addWorkflowLogProvider).toHaveBeenCalledTimes(1);
    const provider = extensionPoint.addWorkflowLogProvider.mock
      .calls[0][0] as WorkflowLogProvider;
    expect(provider.getProviderId()).toBe('loki');
  });
});
