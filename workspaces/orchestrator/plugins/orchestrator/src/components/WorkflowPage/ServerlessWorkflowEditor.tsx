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
import { useEffect, useRef } from 'react';

import { ErrorPanel } from '@backstage/core-components';

import { EditorApi } from '@kie-tools-core/editor/dist/api/Editor.ts';
import * as SwfEditor from '@kie-tools/serverless-workflow-standalone-editor/dist/swf';

import { WorkflowFormatDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

type WorkflowEditorProps = {
  format: WorkflowFormatDTO;
  loadingWorkflowSource: boolean;
  workflowSource: string;
  errorWorkflowSource: Error | undefined;
};

const ServerlessWorkflowEditor = ({
  format,
  loadingWorkflowSource,
  workflowSource,
  errorWorkflowSource,
}: WorkflowEditorProps) => {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorApi | null>(null);

  useEffect(() => {
    if (editorContainerRef.current && !editorRef.current) {
      editorRef.current = SwfEditor.open({
        container: editorContainerRef.current,
        initialContent: Promise.resolve(workflowSource),
        readOnly: true,
        languageType: format,
        swfPreviewOptions: { editorMode: 'full', defaultWidth: '50%' },
      });
    }

    return () => {
      editorRef.current = null;
      editorContainerRef.current = null;
    };
  }, [format, workflowSource]);

  return (
    <>
      {errorWorkflowSource && <ErrorPanel error={errorWorkflowSource} />}
      {!loadingWorkflowSource && !errorWorkflowSource && (
        <div ref={editorContainerRef} style={{ height: '600px' }} />
      )}
    </>
  );
};

export default ServerlessWorkflowEditor;
