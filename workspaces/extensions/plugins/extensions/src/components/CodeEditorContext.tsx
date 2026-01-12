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

import type { ReactNode } from 'react';
import { createContext, useRef, useMemo, useContext } from 'react';

import type MonacoEditor from 'monaco-editor';

interface CodeEditorContextValue {
  getEditor: () => MonacoEditor.editor.ICodeEditor | null;
  setEditor: (editor: MonacoEditor.editor.ICodeEditor) => void;

  getSelection: () => MonacoEditor.Selection | null;
  setSelection: (editorSelection: MonacoEditor.Selection) => void;

  getPosition: () => MonacoEditor.Position | null;
  setPosition: (cursorPosition: MonacoEditor.Position) => void;
  /** short for getEditor()?.getValue() */
  getValue: () => string | undefined;
  /** short for getEditor()?.setValue() and getEditor()?.focus() */
  setValue: (value: string, autoFocus?: boolean) => void;
}

const CodeEditorContext = createContext<CodeEditorContextValue>(
  undefined as any as CodeEditorContextValue,
);

export const CodeEditorContextProvider = (props: { children: ReactNode }) => {
  const editorRef = useRef<MonacoEditor.editor.ICodeEditor | null>(null);
  const contextValue = useMemo<CodeEditorContextValue>(
    () => ({
      getEditor: () => editorRef.current,
      setEditor: (editor: MonacoEditor.editor.ICodeEditor) => {
        editorRef.current = editor;
      },
      getPosition: () => editorRef.current?.getPosition() || null,
      setPosition: (cursorPosition: MonacoEditor.Position) => {
        editorRef.current?.setPosition(cursorPosition);
      },
      getSelection: () => editorRef.current?.getSelection() || null,
      setSelection: (editorSelection: MonacoEditor.Selection) => {
        editorRef.current?.setSelection(editorSelection);
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
  const contextValue = useContext(CodeEditorContext);
  if (!contextValue) {
    throw new Error(
      'useCodeEditor must be used within a CodeEditorContextProvider',
    );
  }
  return contextValue;
};
