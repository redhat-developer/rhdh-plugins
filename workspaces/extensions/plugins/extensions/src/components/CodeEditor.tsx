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

import { useState, useCallback } from 'react';

import { Progress } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import Editor, {
  loader,
  type OnChange,
  type OnMount,
} from '@monaco-editor/react';

import type MonacoEditor from 'monaco-editor';
import { useCodeEditor } from './CodeEditorContext';

// Import Monaco Editor modules - CodeEditor is lazy-loaded via CodeEditorCard
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
// @ts-ignore
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

loader.config({ monaco: monacoEditor });

const defaultOptions: MonacoEditor.editor.IEditorConstructionOptions = {
  minimap: { enabled: false },
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
