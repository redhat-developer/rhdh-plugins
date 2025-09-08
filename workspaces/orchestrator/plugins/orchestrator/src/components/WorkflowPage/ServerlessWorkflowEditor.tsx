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
import { CodeSnippet, ErrorPanel } from '@backstage/core-components';

import { makeStyles } from 'tss-react/mui';

import { WorkflowFormatDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

type WorkflowEditorProps = {
  format: WorkflowFormatDTO;
  loadingWorkflowSource: boolean;
  workflowSource: string;
  errorWorkflowSource: Error | undefined;
};

const useStyles = makeStyles()(_ => ({
  codeSnippetCOntainer: {
    '& pre': {
      backgroundColor: 'transparent !important',
    },
  },
}));

const ServerlessWorkflowEditor = ({
  format,
  loadingWorkflowSource,
  workflowSource,
  errorWorkflowSource,
}: WorkflowEditorProps) => {
  const { classes } = useStyles();

  return (
    <>
      {errorWorkflowSource && <ErrorPanel error={errorWorkflowSource} />}
      {!loadingWorkflowSource && !errorWorkflowSource && (
        <div className={classes.codeSnippetCOntainer}>
          <CodeSnippet
            text={workflowSource}
            language={format}
            showLineNumbers
            showCopyCodeButton
          />
        </div>
      )}
    </>
  );
};

export default ServerlessWorkflowEditor;
