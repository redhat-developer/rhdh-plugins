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
  PipelineRunResource,
  ReleaseResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { PipelineRunType } from '../../utils/pipeline-runs';

export type LatestPipelineRunByType = {
  [PipelineRunType.BUILD]: PipelineRunResource | null;
  [PipelineRunType.TEST]: PipelineRunResource | null;
  [PipelineRunType.RELEASE]: ReleaseResource | null;
};

export type SubcomponentLatestPipelineRunByType = Record<
  string,
  LatestPipelineRunByType
>;
