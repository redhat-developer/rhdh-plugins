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

import { LoggerService } from '@backstage/backend-plugin-api';

import { ProcessInstanceDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { ErrorBuilder } from '../helpers/errorBuilder';

export class WorkflowLoggerService {
  private readonly logStorageURL: string;
  public constructor(
    // private readonly dataIndexUrl: string,
    private readonly storageURL: string,
    private readonly logger: LoggerService,
  ) {
    if (!storageURL.length) {
      throw ErrorBuilder.GET_NO_LOG_STORAGE_URL_ERR();
    }

    this.logStorageURL = storageURL;
  }

  public async fetchWorkflowLogsById(instance: ProcessInstanceDTO) {
    console.log(instance);
  }
}
