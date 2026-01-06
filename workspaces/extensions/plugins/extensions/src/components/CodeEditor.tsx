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

import {
  createContext,
  useRef,
  useMemo,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

import { Progress } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import Editor, { loader, OnChange, OnMount } from '@monaco-editor/react';
import type MonacoEditor from 'monaco-editor';

// Configure monaco-editor to load lazily from CDN or via dynamic import
// This prevents the 4.8MB monaco bundle from being included in the main chunk
let monacoConfigured = false;
const configureMonaco = async () => {
  if (monacoConfigured) return;
  monacoConfigured = true;

  // Dynamically import monaco-editor only when needed
  const [monacoEditor] = await Promise.all([
    import('monaco-editor/esm/vs/editor/editor.api'),
    import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'),
  ]);

  loader.config({ monaco: monacoEditor });
};

const defaultOptions: MonacoEditor.editor.IEditorConstructionOptions = {
  minimap: { enabled: false },
};

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
  const theme = useTheme();
  const paletteMode = theme.palette.mode === 'dark' ? 'vs-dark' : 'vs-light';

  const codeEditor = useCodeEditor();
  const [copied, setCopied] = useState(false);
  const [monacoReady, setMonacoReady] = useState(monacoConfigured);

  // Lazy load monaco-editor when the component mounts
  useEffect(() => {
    if (!monacoReady) {
      configureMonaco().then(() => setMonacoReady(true));
    }
  }, [monacoReady]);

  const onMount = useCallback<OnMount>(
    (editor, _monaco) => {
      codeEditor.setEditor(editor);
      onLoaded?.();
    },
    [codeEditor, onLoaded],
  );

  const handleCopy = async () => {
    const text = codeEditor.getValue();
    if (text) {
      await window.navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show loading while monaco is being lazy-loaded
  if (!monacoReady) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Progress />
      </Box>
    );
  }

  return (
    <Box position="relative" sx={{ width: '100%', height: '100%' }}>
      <Button
        variant="text"
        onClick={handleCopy}
        sx={{
          position: 'absolute',
          top: 0,
          right: 10,
          zIndex: 1,
          minWidth: '32px',
          minHeight: '32px',
          p: 0,
          '&:hover': { bgcolor: 'transparent' },
        }}
      >
        {copied ? (
          <Typography color={theme.palette.text.secondary}>✔</Typography>
        ) : (
          <ContentCopyRoundedIcon
            fontSize="small"
            sx={{ mx: 1, color: theme.palette.text.secondary }}
          />
        )}
      </Button>

      <Editor
        theme={paletteMode}
        defaultLanguage={defaultLanguage}
        onChange={onChange}
        onMount={onMount}
        loading={<Progress />}
        options={defaultOptions}
        {...otherProps}
      />
    </Box>
  );
};
