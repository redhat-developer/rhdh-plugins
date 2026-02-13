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

import { screen, waitFor } from '@testing-library/react';
import { PipelineRunResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { renderInTestApp } from '@backstage/test-utils';
import { PipelineRunInfo } from '../PipelineRunInfo';

const renderPipelineRunInfo = async (
  text: string,
  pipelineRun: PipelineRunResource | null,
) =>
  await renderInTestApp(
    <PipelineRunInfo pipelineRun={pipelineRun} text={text} />,
  );
describe('PipelineRunInfo', () => {
  it('should return null if pipelineRun is null', async () => {
    await renderPipelineRunInfo('pipeline-run-name', null);
    await waitFor(() => {
      expect(screen.queryByText('pipeline-run-name')).not.toBeInTheDocument();
    });
  });

  it('should render external link if pipelineRun is valid', async () => {
    await renderPipelineRunInfo('pipeline-run-name', {
      kind: 'PipelineRun',
      apiVersion: 'v1',
      metadata: {
        name: 'plr1',
      },
      cluster: {
        name: 'cluster1',
      },
      subcomponent: {
        name: 'sub1',
      },
    });
    await waitFor(() => {
      expect(screen.getByText('pipeline-run-name')).toBeInTheDocument();
    });
  });
});
