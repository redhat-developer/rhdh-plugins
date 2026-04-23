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
import { SchedulerServiceTaskScheduleDefinitionConfig } from '@backstage/backend-plugin-api';

export interface Config {
  /** Configuration for scorecard plugin */
  scorecard?: {
    /** Configuration for scorecard plugins/datasources */
    plugins?: {
      /** File existence check configuration */
      files_check?: {
        /** File existence checks configuration */
        files?: Array<{
          /** Key is the metric identifier, value is the file path */
          [metricId: string]: string;
        }>;
        schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
      };
    };
  };
}
