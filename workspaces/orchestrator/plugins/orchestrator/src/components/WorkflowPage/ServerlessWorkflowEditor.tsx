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
import { ErrorPanel } from '@backstage/core-components';

import { WorkflowFormatDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { useIsDarkMode } from '../../utils/isDarkMode';
import { TextCodeBlock } from '../ui/TextCodeBlock';

type WorkflowEditorProps = {
  format: WorkflowFormatDTO;
  loadingWorkflowSource: boolean;
  workflowSource: string;
  errorWorkflowSource: Error | undefined;
};

const ServerlessWorkflowEditor = ({
  loadingWorkflowSource,
  workflowSource,
  errorWorkflowSource,
}: WorkflowEditorProps) => {
  const isDarkMode = useIsDarkMode();

  return (
    <>
      {errorWorkflowSource && <ErrorPanel error={errorWorkflowSource} />}
      {!loadingWorkflowSource && !errorWorkflowSource && (
        <TextCodeBlock
          value={workflowSource}
          isDarkMode={isDarkMode}
          fullWidth
        />
      )}
    </>
  );
};

export default ServerlessWorkflowEditor;
