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

import { MarkdownContent } from '@backstage/core-components';

export interface MarkdownProps {
  title?: string;
  content: string;
}

export const Markdown = (props: MarkdownProps) => {
  let content = props.content ?? '**no description provided**';
  if (props.title && !content.startsWith('# ')) {
    content = `# ${props.title}\n\n${content}`;
  }

  // TODO load images from marketplace assets endpoint ???
  const transformImageUri = (href: string): string => {
    // console.log('Markdown transformImageUri href', href);
    return href;
  };

  return (
    <MarkdownContent
      content={content}
      dialect="gfm"
      linkTarget="_blank"
      transformImageUri={transformImageUri}
    />
  );
};
