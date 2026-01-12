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

import { useEffect } from 'react';

import { MarkdownContent } from '@backstage/core-components';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

export interface MarkdownProps {
  title?: string;
  content: string;
}

const copyIconSvg = (buttonColor: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${buttonColor}">
    <g><rect fill="none" height="24" width="24"/></g>
    <g>
      <path d="M15,20H5V7c0-0.55-0.45-1-1-1h0C3.45,6,3,6.45,3,7v13c0,1.1,0.9,2,2,2h10c0.55,0,1-0.45,1-1v0C16,20.45,15.55,20,15,20z M20,16V4c0-1.1-0.9-2-2-2H9C7.9,2,7,2.9,7,4v12c0,1.1,0.9,2,2,2h9C19.1,18,20,17.1,20,16z M18,16H9V4h9V16z"/>
    </g>
  </svg>
`;

const handleCopyClick = (
  button: HTMLButtonElement,
  codeBlock: HTMLElement,
  buttonColor: string,
) => {
  window.navigator.clipboard.writeText(codeBlock.innerText).then(() => {
    button.innerText = '✔';
    setTimeout(() => {
      button.innerHTML = copyIconSvg(buttonColor);
    }, 2000);
  });
};

export const Markdown = (props: MarkdownProps) => {
  const theme = useTheme();
  let content = props.content ?? '**no description provided**';
  if (props.title && !content.startsWith('# ')) {
    content = `## ${props.title}\n\n${content}`;
  }

  // TODO load images from extensions assets endpoint ???
  const transformImageUri = (href: string): string => {
    return href;
  };

  useEffect(() => {
    document.querySelectorAll('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;

      if (!pre) return;
      if (pre.querySelector('.copy-button')) return;

      const button = document.createElement('button');
      button.className = 'copy-button';
      Object.assign(button.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '2px',
        color: theme.palette.text.secondary,
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
      });

      button.innerHTML = copyIconSvg(theme.palette.text.secondary);

      button.addEventListener('click', () =>
        handleCopyClick(
          button,
          codeBlock as HTMLElement,
          theme.palette.text.secondary,
        ),
      );

      pre.style.position = 'relative';
      pre.appendChild(button);
    });
  }, [content, theme.palette.text.secondary]);

  return (
    <Box
      sx={{
        '& h2': {
          fontWeight: 500,
          fontSize: '1rem',
          marginTop: 0,
          marginBottom: '8px',
        },
      }}
    >
      <MarkdownContent
        content={content}
        dialect="gfm"
        linkTarget="_blank"
        transformImageUri={transformImageUri}
      />
    </Box>
  );
};
