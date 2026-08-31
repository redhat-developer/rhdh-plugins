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

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CodeIcon from '@material-ui/icons/Code';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import { useTranslation } from '../hooks/useTranslation';
import { validateJsonObject } from '../utils/validateJsonObject';

SyntaxHighlighter.registerLanguage('json', json);

const useStyles = makeStyles(theme => ({
  schemaLabel: {
    marginBottom: theme.spacing(0.5),
  },
  dialogContent: {
    paddingTop: theme.spacing(1),
  },
  editorWrapper: {
    position: 'relative' as const,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    '&:focus-within': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
    },
  },
  editorWrapperError: {
    borderColor: theme.palette.error.main,
    '&:focus-within': {
      borderColor: theme.palette.error.main,
      boxShadow: `0 0 0 1px ${theme.palette.error.main}`,
    },
  },
  editorTextarea: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: '12px',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    background: 'transparent',
    color: 'transparent',
    caretColor: theme.palette.text.primary,
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 13,
    lineHeight: '1.45',
    whiteSpace: 'pre' as const,
    overflowWrap: 'normal' as const,
    overflow: 'auto',
    zIndex: 1,
    WebkitTextFillColor: 'transparent',
  },
  editorHighlight: {
    margin: 0,
    padding: '12px !important',
    minHeight: 280,
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace !important',
    fontSize: '13px !important',
    lineHeight: '1.45 !important',
    whiteSpace: 'pre' as const,
    overflowWrap: 'normal' as const,
    overflow: 'auto',
    background: `${theme.palette.background.paper} !important`,
  },
  editorHelperText: {
    marginTop: theme.spacing(0.5),
    display: 'block',
  },
}));

function validateSchemaJsonRaw(raw: string): 'not_object' | 'syntax' | '' {
  const result = validateJsonObject(raw);
  if (result.status === 'empty' || result.status === 'ok') return '';
  return result.status;
}

function prettyPrintIfValid(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export type SchemaButtonProps = Readonly<{
  value: string;
  onChange: (v: string) => void;
  /** Error on the stored value (e.g. from import or duplicate detection). */
  fieldError?: string;
}>;

/**
 * Inline JSON schema editor — shows a "Add JSON" / "Edit JSON" button that
 * opens a syntax-highlighted textarea dialog.
 */
export function SchemaButton({
  value,
  onChange,
  fieldError,
}: SchemaButtonProps) {
  const classes = useStyles();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const jsonErrorCode = useMemo(() => validateSchemaJsonRaw(draft), [draft]);
  let jsonError = '';
  if (jsonErrorCode === 'not_object') {
    jsonError = t('catalogItems.form.schemaMustBeObject');
  } else if (jsonErrorCode === 'syntax') {
    jsonError = t('catalogItems.form.schemaInvalidJson');
  }
  const applyDisabled = draft.trim() !== '' && Boolean(jsonErrorCode);
  const hasError = Boolean(draft.trim() && jsonErrorCode);

  const handleOpen = () => {
    setDraft(value ? prettyPrintIfValid(value) : '');
    setOpen(true);
  };

  const handleApply = useCallback(() => {
    if (applyDisabled) return;
    onChange(draft.trim());
    setOpen(false);
  }, [applyDisabled, draft, onChange]);

  const handleClose = () => setOpen(false);

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    const afterEnter = `${draft}\n`;
    const formatted = prettyPrintIfValid(afterEnter);
    if (formatted !== afterEnter) {
      e.preventDefault();
      setDraft(formatted);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    const { selectionStart: start, selectionEnd: end } = e.currentTarget;
    const afterPaste =
      draft.slice(0, start ?? 0) + pasted + draft.slice(end ?? 0);
    const formatted = prettyPrintIfValid(afterPaste);
    if (formatted !== afterPaste) {
      e.preventDefault();
      setDraft(formatted);
    }
  };

  return (
    <>
      <Box display="flex" flexDirection="column">
        <Typography
          variant="caption"
          color="textSecondary"
          className={classes.schemaLabel}
        >
          {t('catalogItems.form.schemaLabel')}
        </Typography>
        <Box display="flex" alignItems="center" gridGap={6}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CodeIcon fontSize="small" />}
            onClick={handleOpen}
            color={fieldError ? 'secondary' : 'primary'}
          >
            {value
              ? t('catalogItems.form.schemaEditButton')
              : t('catalogItems.form.schemaAddButton')}
          </Button>
        </Box>
        {fieldError && (
          <Typography variant="caption" color="error">
            {fieldError}
          </Typography>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('catalogItems.form.schemaDialogTitle')}</DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <Box
            className={`${classes.editorWrapper} ${
              hasError ? classes.editorWrapperError : ''
            }`}
          >
            <div ref={highlightRef} style={{ overflow: 'hidden' }}>
              <SyntaxHighlighter
                language="json"
                style={docco}
                className={classes.editorHighlight}
              >
                {draft || ' '}
              </SyntaxHighlighter>
            </div>
            <textarea
              ref={textareaRef}
              className={classes.editorTextarea}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onScroll={syncScroll}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder='{"type":"integer","minimum":0}'
            />
          </Box>
          <Typography
            variant="caption"
            color={hasError ? 'error' : 'textSecondary'}
            className={classes.editorHelperText}
          >
            {(draft.trim() && jsonError) ||
              t('catalogItems.form.schemaDialogHelper')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            {t('catalogItems.form.schemaDialogCancel')}
          </Button>
          <Button
            onClick={handleApply}
            color="primary"
            variant="contained"
            disabled={applyDisabled}
          >
            {t('catalogItems.form.schemaDialogApply')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
