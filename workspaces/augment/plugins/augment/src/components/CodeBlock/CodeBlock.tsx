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

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

// ---------------------------------------------------------------------------
//  InlineCode — rendered by react-markdown for bare `code` elements
// ---------------------------------------------------------------------------

/**
 * Inline code renderer for react-markdown v10+.
 *
 * In v10 the `code` component is called for BOTH inline and block code,
 * but block code is always wrapped in a `<pre>` via the `pre` component.
 * We register `InlineCode` as the `code` component so it only handles
 * inline backtick code; the `PreBlock` component below handles block code.
 */
export const InlineCode = ({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <code
      className={className}
      style={{
        backgroundColor: alpha(
          theme.palette.text.primary,
          isDark ? 0.08 : 0.05,
        ),
        padding: '2px 6px',
        borderRadius: 4,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: '0.85em',
        fontWeight: 400,
      }}
      {...rest}
    >
      {children}
    </code>
  );
};

// ---------------------------------------------------------------------------
//  PreBlock — rendered by react-markdown for `<pre>` elements (block code)
// ---------------------------------------------------------------------------

/**
 * Block code renderer for react-markdown v10+.
 *
 * react-markdown wraps fenced code blocks in `<pre><code>…</code></pre>`.
 * We intercept the `pre` element, extract the language from the child
 * `<code>` className, and render with syntax highlighting + copy button.
 */
export const PreBlock = (props: {
  children?: ReactNode;
  [key: string]: unknown;
}) => {
  const { children } = props;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Extract language and text from the child <code> element
  let language = '';
  let codeString = '';

  if (isValidElement(children)) {
    const codeElement = children as ReactElement<{
      className?: string;
      children?: ReactNode;
    }>;
    const className = codeElement.props?.className || '';
    const langMatch = /language-(\w+)/.exec(className);
    language = langMatch ? langMatch[1] : '';
    codeString = String(codeElement.props?.children ?? '').replace(/\n$/, '');
  } else {
    codeString = String(children ?? '').replace(/\n$/, '');
  }

  const handleCopy = useCallback(() => {
    window.navigator.clipboard
      .writeText(codeString)
      .then(() => {
        setCopied(true);
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* clipboard API unavailable (e.g. non-HTTPS) */
      });
  }, [codeString]);

  return (
    <Box
      sx={{
        position: 'relative',
        my: 2,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          backgroundColor: alpha(
            theme.palette.text.primary,
            isDark ? 0.04 : 0.03,
          ),
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'lowercase',
            fontFamily:
              '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
          }}
        >
          {language || 'code'}
        </Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            aria-label="Copy code"
            sx={{
              color: copied
                ? theme.palette.success.main
                : theme.palette.text.secondary,
              p: 0.5,
              '&:hover': {
                color: theme.palette.text.primary,
              },
            }}
          >
            {copied ? (
              <CheckIcon sx={{ fontSize: 14 }} />
            ) : (
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <SyntaxHighlighter
        language={language || 'text'}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          fontFamily:
            '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
          background: 'transparent',
          border: 'none',
        }}
        codeTagProps={{
          style: {
            fontFamily:
              '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
          },
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </Box>
  );
};

/**
 * @deprecated Use InlineCode + PreBlock instead.
 * Kept for backward compatibility with any direct imports.
 */
export const CodeBlock = InlineCode;
