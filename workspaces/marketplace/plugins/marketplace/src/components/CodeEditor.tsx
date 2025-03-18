/*
 * Copyright The Backstage Authors
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

import React from 'react';

import { Progress } from '@backstage/core-components';

import { useTheme } from '@mui/material/styles';
import Editor, { loader, OnChange, OnMount } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor';
import type MonacoEditor from 'monaco-editor';

loader.config({ monaco: monacoEditor });

const defaultOptions: MonacoEditor.editor.IEditorConstructionOptions = {
  minimap: { enabled: false },
};

interface CodeEditorContextValue {
  getEditor: () => MonacoEditor.editor.ICodeEditor | null;
  setEditor: (editor: MonacoEditor.editor.ICodeEditor) => void;
  /** short for getEditor()?.getValue() */
  getValue: () => string | undefined;
  /** short for getEditor()?.setValue() and getEditor()?.focus() */
  setValue: (value: string, autoFocus?: boolean) => void;
}

const CodeEditorContext = React.createContext<CodeEditorContextValue>(
  undefined as any as CodeEditorContextValue,
);

export const CodeEditorContextProvider = (props: {
  children: React.ReactNode;
}) => {
  const editorRef = React.useRef<MonacoEditor.editor.ICodeEditor | null>(null);
  const contextValue = React.useMemo<CodeEditorContextValue>(
    () => ({
      getEditor: () => editorRef.current,
      setEditor: (editor: MonacoEditor.editor.ICodeEditor) => {
        editorRef.current = editor;
      },
      getValue: () => editorRef.current?.getValue(),
      setValue: (value: string, autoFocus = true) => {
        editorRef.current?.setValue(value);
        if (autoFocus) {
          editorRef.current?.focus();
        }
      },
    }),
    [],
  );

  return (
    <CodeEditorContext.Provider value={contextValue}>
      {props.children}
    </CodeEditorContext.Provider>
  );
};

export const useCodeEditor = () => {
  const contextValue = React.useContext(CodeEditorContext);
  if (!contextValue) {
    throw new Error(
      'useCodeEditor must be used within a CodeEditorContextProvider',
    );
  }
  return contextValue;
};

export interface CodeEditorProps {
  defaultLanguage: 'yaml'; // We enforce YAML for now
  defaultValue?: string;
  onChange?: OnChange;
  onLoaded?: () => void;
}

/**
 * Wrapper around Editor from @monaco-editor/react.
 * It automaticallty sets the editor into the current
 * CodeEditorContext so that it can be accessed via useCodeEditor
 * and we can have a uncontrolled input component.
 */
export const CodeEditor = ({
  defaultLanguage,
  onChange,
  onLoaded,
  ...otherProps
}: CodeEditorProps) => {
  const theme = useTheme().palette.mode === 'dark' ? 'vs-dark' : 'vs-light';

  const codeEditor = useCodeEditor();

  const onMount = React.useCallback<OnMount>(
    (editor, _monaco) => {
      codeEditor.setEditor(editor);
      onLoaded?.();
    },
    [codeEditor, onLoaded],
  );

  return (
    <Editor
      theme={theme}
      defaultLanguage={defaultLanguage}
      onChange={onChange}
      onMount={onMount}
      loading={<Progress />}
      options={defaultOptions}
      {...otherProps}
    />
  );
};
