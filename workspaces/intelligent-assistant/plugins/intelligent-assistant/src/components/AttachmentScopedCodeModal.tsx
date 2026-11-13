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

import { useEffect, useRef, useState } from 'react';
import type {
  ComponentProps,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';

import {
  ChatbotDisplayMode,
  ChatbotModal,
  extensionToLanguage,
  FileDetails,
} from '@patternfly/chatbot';
import { CodeEditor } from '@patternfly/react-code-editor';
import {
  Bullseye,
  Button,
  getResizeObserver,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

/** PatternFly ChatbotModal onClose uses DOM KeyboardEvent, not React's. */
export type ModalUserEvent = ReactMouseEvent | KeyboardEvent;

export type AttachmentScopedCodeModalProps = {
  appendTo: () => HTMLElement;
  code: string;
  fileName: string;
  codeEditorControlClassName?: string;
  handleModalToggle: (event: ModalUserEvent) => void;
  isCopyEnabled?: boolean;
  isLineNumbersVisible?: boolean;
  isModalOpen: boolean;
  isReadOnly?: boolean;
  onPrimaryAction: (event: ModalUserEvent, code?: string) => void;
  onSecondaryAction: (event: ModalUserEvent) => void;
  primaryActionBtn: string;
  secondaryActionBtn: string;
  title: string;
  modalHeaderClassName?: string;
  modalBodyClassName?: string;
  modalFooterClassName?: string;
  spinnerAriaLabel?: string;
};

const SCOPED_BACKDROP_CLASS = 'ia-scoped-chat-modal-backdrop';

type CodeEditorLanguage = ComponentProps<typeof CodeEditor>['language'];

type StandaloneCodeEditor = {
  layout: () => void;
  focus: () => void;
};

let monacoReady = false;

function languageForFileName(fileName: string): CodeEditorLanguage {
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const language = (extensionToLanguage as Record<string, string>)[ext];
  return (language ?? 'plaintext') as CodeEditorLanguage;
}

async function loadMonaco(): Promise<void> {
  if (monacoReady) {
    return;
  }
  if (
    !globalThis.MonacoEnvironment?.getWorker &&
    !globalThis.MonacoEnvironment?.getWorkerUrl
  ) {
    // eslint-disable-next-line no-console
    console.error(
      'Monaco web workers are not configured. Call ensureMonacoEditorWorkerEnvironment before opening attachment modals.',
    );
  }
  const [monaco, { loader }] = await Promise.all([
    import('monaco-editor'),
    import('@monaco-editor/react'),
  ]);
  loader.config({ monaco });
  monacoReady = true;
}

/** CodeModal with `appendTo` (not supported on upstream @patternfly/chatbot CodeModal). */
export function AttachmentScopedCodeModal(
  props: Readonly<AttachmentScopedCodeModalProps>,
) {
  const {
    appendTo,
    fileName,
    code,
    codeEditorControlClassName: codeEditorClassName,
    handleModalToggle,
    isCopyEnabled,
    isLineNumbersVisible,
    isModalOpen,
    isReadOnly,
    onPrimaryAction,
    onSecondaryAction,
    primaryActionBtn,
    secondaryActionBtn,
    title,
    modalHeaderClassName,
    modalBodyClassName,
    modalFooterClassName,
    spinnerAriaLabel = 'Loading',
  } = props;

  const [newCode, setNewCode] = useState(code);
  const [editorInstance, setEditorInstance] =
    useState<StandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isMonacoLoading, setIsMonacoLoading] = useState(false);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNewCode(code);
  }, [code]);

  useEffect(() => {
    if (isModalOpen && !isMonacoLoaded && !isMonacoLoading) {
      setIsMonacoLoading(true);
      loadMonaco()
        .then(() => {
          setIsMonacoLoaded(true);
          setIsMonacoLoading(false);
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error('Failed to load Monaco editor:', error);
          setIsMonacoLoading(false);
        });
    }
  }, [isModalOpen, isMonacoLoaded, isMonacoLoading]);

  useEffect(() => {
    if (
      !isModalOpen ||
      !isEditorReady ||
      !editorInstance ||
      !containerRef.current
    ) {
      return undefined;
    }

    const handleResize = () => {
      if (editorInstance && isEditorReady && isModalOpen) {
        try {
          window.requestAnimationFrame(() => {
            editorInstance.layout();
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('ChatBot code modal layout error:', error);
        }
      }
    };

    const observer = getResizeObserver(containerRef.current, handleResize);
    return () => {
      observer();
    };
  }, [editorInstance, isEditorReady, isModalOpen]);

  const handlePrimaryAction = (event: ModalUserEvent) => {
    handleModalToggle(event);
    if (!isReadOnly) {
      onPrimaryAction(event, newCode);
    } else {
      onPrimaryAction(event);
    }
  };

  const handleSecondaryAction = (event: ModalUserEvent) => {
    handleModalToggle(event);
    onSecondaryAction(event);
  };

  const onEditorDidMount = (editor: StandaloneCodeEditor) => {
    setEditorInstance(editor);
    if (containerRef.current) {
      setIsEditorReady(true);
      editor.layout();
      editor.focus();
    }
  };

  const onCodeChange = (value: string) => {
    if (!isReadOnly) {
      setNewCode(value);
    }
  };

  let editorContent: ReactNode = null;
  if (isMonacoLoading) {
    editorContent = (
      <Bullseye>
        <Spinner aria-label={spinnerAriaLabel} />
      </Bullseye>
    );
  } else if (isMonacoLoaded) {
    editorContent = (
      <CodeEditor
        isDarkTheme
        isLineNumbersVisible={isLineNumbersVisible}
        isLanguageLabelVisible
        isCopyEnabled={isCopyEnabled}
        isReadOnly={isReadOnly}
        code={newCode}
        language={languageForFileName(fileName)}
        onEditorDidMount={onEditorDidMount}
        onCodeChange={onCodeChange}
        className={codeEditorClassName}
        isFullHeight
        options={{
          glyphMargin: false,
          folding: false,
          automaticLayout: false,
        }}
      />
    );
  }

  return (
    <ChatbotModal
      isOpen={isModalOpen}
      onClose={handleModalToggle}
      ouiaId="CodeModal"
      aria-labelledby="code-modal-title"
      aria-describedby="code-modal"
      className="pf-chatbot__code-modal pf-m-compact ia-scoped-attachment-code-modal"
      displayMode={ChatbotDisplayMode.default}
      isCompact
      appendTo={appendTo}
      backdropClassName={`${SCOPED_BACKDROP_CLASS} pf-chatbot__chatbot-modal-backdrop`}
    >
      <ModalHeader
        className={modalHeaderClassName}
        title={title}
        labelId="code-modal-title"
      />
      <ModalBody className={modalBodyClassName} id="code-modal-body">
        <Stack className="pf-chatbot__code-modal-body">
          <StackItem className="pf-chatbot__code-modal-file-details">
            <FileDetails fileName={fileName} />
          </StackItem>
          <div
            className="pf-v6-l-stack__item pf-chatbot__code-modal-editor"
            ref={containerRef}
          >
            {editorContent}
          </div>
        </Stack>
      </ModalBody>
      <ModalFooter className={modalFooterClassName}>
        <Button
          key="code-modal-primary"
          isBlock
          variant="primary"
          onClick={handlePrimaryAction}
          form="code-modal-form"
        >
          {primaryActionBtn}
        </Button>
        <Button
          key="code-modal-secondary"
          isBlock
          variant="link"
          onClick={handleSecondaryAction}
        >
          {secondaryActionBtn}
        </Button>
      </ModalFooter>
    </ChatbotModal>
  );
}
