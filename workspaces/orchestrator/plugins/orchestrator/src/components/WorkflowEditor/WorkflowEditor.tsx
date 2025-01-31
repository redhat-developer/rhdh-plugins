/*
 * Copyright 2024 The Backstage Authors
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
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

import { configApiRef, useApi } from '@backstage/core-plugin-api';

import {
  ChannelType,
  EditorEnvelopeLocator,
  EnvelopeContentType,
  EnvelopeMapping,
} from '@kie-tools-core/editor/dist/api';
import {
  EmbeddedEditorFile,
  StateControl,
} from '@kie-tools-core/editor/dist/channel';
import {
  EmbeddedEditor,
  EmbeddedEditorChannelApiImpl,
  useEditorRef,
} from '@kie-tools-core/editor/dist/embedded';
import { Notification } from '@kie-tools-core/notifications/dist/api';
import {
  PromiseStateWrapper,
  usePromiseState,
} from '@kie-tools-core/react-hooks/dist/PromiseState';
import { useCancelableEffect } from '@kie-tools-core/react-hooks/dist/useCancelableEffect';
import { editorDisplayOptions } from '@kie-tools/serverless-workflow-combined-editor/dist/api';
import { SwfCombinedEditorChannelApiImpl } from '@kie-tools/serverless-workflow-combined-editor/dist/channel/SwfCombinedEditorChannelApiImpl';
import { SwfPreviewOptionsChannelApiImpl } from '@kie-tools/serverless-workflow-combined-editor/dist/channel/SwfPreviewOptionsChannelApiImpl';
import {
  DiagnosticSeverity,
  type Diagnostic,
} from 'vscode-languageserver-types';

import {
  fromWorkflowSource,
  ProcessInstance,
  toWorkflowString,
  WorkflowDefinition,
  WorkflowFormat,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { WorkflowEditorLanguageService } from './channel/WorkflowEditorLanguageService';
import { WorkflowEditorLanguageServiceChannelApiImpl } from './channel/WorkflowEditorLanguageServiceChannelApiImpl';

export enum EditorViewKind {
  DIAGRAM_VIEWER = 'DIAGRAM_VIEWER',
  EXTENDED_DIAGRAM_VIEWER = 'EXTENDED_DIAGRAM_VIEWER',
  RUNTIME = 'RUNTIME',
}

export interface WorkflowEditorRef {
  validate: () => Promise<Notification[]>;
  getContent: () => Promise<string | undefined>;
  workflowDefinition: WorkflowDefinition | undefined;
  isReady: boolean;
}

const LOCALE = 'en';

export type WorkflowEditorView =
  | { kind: EditorViewKind.DIAGRAM_VIEWER }
  | { kind: EditorViewKind.EXTENDED_DIAGRAM_VIEWER }
  | { kind: EditorViewKind.RUNTIME; processInstance: ProcessInstance };

type WorkflowEditorProps = {
  workflowId: string;
  format: WorkflowFormat;
  editorMode?: editorDisplayOptions;
} & WorkflowEditorView;

const RefForwardingWorkflowEditor: ForwardRefRenderFunction<
  WorkflowEditorRef,
  WorkflowEditorProps
> = (props, forwardedRef) => {
  const orchestratorApi = useApi(orchestratorApiRef);
  const configApi = useApi(configApiRef);
  const contextPath = `${configApi.getString(
    'backend.baseUrl',
  )}/api/orchestrator/static/generated/envelope`;
  const { workflowId, kind, format, editorMode = 'full' } = props;
  const { editor, editorRef } = useEditorRef();
  const [embeddedFile, setEmbeddedFile] = useState<EmbeddedEditorFile>();
  const [workflowDefinitionPromise, setWorkflowDefinitionPromise] =
    usePromiseState<WorkflowDefinition>();
  const [canRender, setCanRender] = useState(false);
  const [ready, setReady] = useState(false);

  const currentProcessInstance = useMemo(() => {
    if (kind !== EditorViewKind.RUNTIME) {
      return undefined;
    }
    return props.processInstance;
  }, [props, kind]);

  const envelopeLocator = useMemo(
    () =>
      new EditorEnvelopeLocator(window.location.origin, [
        new EnvelopeMapping({
          type: 'workflow',
          filePathGlob: '**/*.sw.+(json|yml|yaml)',
          resourcesPathPrefix: contextPath,
          envelopeContent: {
            type: EnvelopeContentType.PATH,
            path: `${contextPath}/serverless-workflow-combined-editor-envelope.html`,
          },
        }),
      ]),
    [contextPath],
  );

  const stateControl = useMemo(() => new StateControl(), []);

  const languageService = useMemo(() => {
    if (!embeddedFile) {
      return undefined;
    }
    const workflowEditorLanguageService = new WorkflowEditorLanguageService();
    return workflowEditorLanguageService.getLs(embeddedFile.path!);
  }, [embeddedFile]);

  const validate = useCallback(async () => {
    if (!editor || !languageService || !embeddedFile) {
      return [];
    }

    const content = await editor.getContent();
    const lsDiagnostics = await languageService.getDiagnostics({
      content: content,
      uriPath: embeddedFile.path!,
    });

    return lsDiagnostics.map(
      (lsDiagnostic: Diagnostic) =>
        ({
          path: '', // empty to not group them by path, as we're only validating one file.
          severity:
            lsDiagnostic.severity === DiagnosticSeverity.Error
              ? 'ERROR'
              : 'WARNING',
          message: `${lsDiagnostic.message} [Line ${
            lsDiagnostic.range.start.line + 1
          }]`,
          type: 'PROBLEM',
          position: {
            startLineNumber: lsDiagnostic.range.start.line + 1,
            startColumn: lsDiagnostic.range.start.character + 1,
            endLineNumber: lsDiagnostic.range.end.line + 1,
            endColumn: lsDiagnostic.range.end.character + 1,
          },
        }) as Notification,
    );
  }, [editor, embeddedFile, languageService]);

  const getContent = useCallback(async () => editor?.getContent(), [editor]);

  const customEditorApi = useMemo(() => {
    if (!embeddedFile || !languageService) {
      return undefined;
    }

    const defaultApiImpl = new EmbeddedEditorChannelApiImpl(
      stateControl,
      embeddedFile,
      LOCALE,
      {
        kogitoEditor_ready: () => {
          setReady(true);
        },
      },
    );

    const workflowEditorLanguageServiceChannelApiImpl =
      new WorkflowEditorLanguageServiceChannelApiImpl(languageService);

    const workflowEditorPreviewOptionsChannelApiImpl =
      new SwfPreviewOptionsChannelApiImpl({
        editorMode,
        defaultWidth: '50%',
      });

    return new SwfCombinedEditorChannelApiImpl({
      defaultApiImpl,
      swfLanguageServiceChannelApiImpl:
        workflowEditorLanguageServiceChannelApiImpl,
      swfPreviewOptionsChannelApiImpl:
        workflowEditorPreviewOptionsChannelApiImpl,
    });
  }, [editorMode, embeddedFile, languageService, stateControl]);

  useImperativeHandle(forwardedRef, () => {
    return {
      validate,
      getContent,
      workflowDefinition: workflowDefinitionPromise.data,
      isReady: ready,
    };
  }, [validate, getContent, workflowDefinitionPromise.data, ready]);

  useCancelableEffect(
    useCallback(
      ({ canceled }) => {
        setCanRender(false);

        orchestratorApi
          .getWorkflowSource(workflowId)
          .then(source => {
            if (canceled.get()) {
              return;
            }
            const definition = fromWorkflowSource(source.data);
            setWorkflowDefinitionPromise({ data: definition });

            const filename = `workflow.sw.${format}`;
            setEmbeddedFile({
              path: filename,
              getFileContents: async () => toWorkflowString(definition, format),
              isReadOnly: true,
              fileExtension: format,
              fileName: filename,
            });

            setCanRender(true);
          })
          .catch(e => {
            setWorkflowDefinitionPromise({ error: e });
          });
      },
      [orchestratorApi, workflowId, setWorkflowDefinitionPromise, format],
    ),
  );

  const embeddedEditorWrapper = useMemo(
    () => (
      <PromiseStateWrapper
        promise={workflowDefinitionPromise}
        resolved={workflowDefinition =>
          canRender &&
          embeddedFile && (
            <EmbeddedEditor
              key={currentProcessInstance?.id ?? workflowDefinition.id}
              ref={editorRef}
              file={embeddedFile}
              channelType={ChannelType.ONLINE}
              editorEnvelopeLocator={envelopeLocator}
              customChannelApiImpl={customEditorApi}
              stateControl={stateControl}
              locale={LOCALE}
              isReady={ready}
            />
          )
        }
      />
    ),
    [
      canRender,
      currentProcessInstance?.id,
      customEditorApi,
      editorRef,
      embeddedFile,
      envelopeLocator,
      ready,
      stateControl,
      workflowDefinitionPromise,
    ],
  );

  return embeddedEditorWrapper;
};

export const WorkflowEditor = forwardRef(RefForwardingWorkflowEditor);
