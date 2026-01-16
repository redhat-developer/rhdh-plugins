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
  getApplicationFromResource,
  PipelineRunResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { css } from '@patternfly/react-styles';

import { getClassNameFromRunStatus } from '../utils';
import { pipelineRunStatus } from '../../../utils/pipeline-runs';

import './PipelineRunInfo.css';
import { ExternalLink } from '../../ExternalLink';
import { getPipelineRunOverviewPath } from '../../../utils/url-paths';

type PipelineRunInfoProps = {
  pipelineRun: PipelineRunResource | null;
  text: string;
  customLinkColor?: string;
};

export const PipelineRunInfo = ({
  pipelineRun,
  text,
  customLinkColor,
}: PipelineRunInfoProps) => {
  const applicationName = getApplicationFromResource(pipelineRun);

  if (!pipelineRun) return null;

  return (
    <div
      className={css(
        getClassNameFromRunStatus(pipelineRunStatus(pipelineRun)),
        'pipeline-run-info-wrapper',
      )}
    >
      <ExternalLink
        to={getPipelineRunOverviewPath(
          pipelineRun.cluster.konfluxUI || '',
          pipelineRun.metadata?.namespace || '',
          applicationName || '',
          pipelineRun.metadata?.name || '',
        )}
        label={text}
        customColor={customLinkColor}
      />
    </div>
  );
};
