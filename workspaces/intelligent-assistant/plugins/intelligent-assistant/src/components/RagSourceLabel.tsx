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

import Box from '@mui/material/Box';
import { CSSObject } from '@mui/material/styles';

/** Shared pill styles for LCORE RAG `source` labels (SourcesCard header + modal). */
export const ragSourceLabelSx: CSSObject = {
  display: 'inline-block',
  boxSizing: 'border-box',
  margin: 0,
  paddingBlock: 0,
  paddingInline: 'var(--pf-t--global--spacer--sm)',
  borderRadius: 'var(--pf-t--global--border--radius--pill)',
  backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
  color: 'var(--pf-t--global--text--color--regular)',
  fontSize: 'var(--pf-t--global--font--size--body--sm)',
  fontWeight: 'var(--pf-t--global--font--weight--body--bold)',
  lineHeight: 'var(--pf-t--global--font--line-height--body)',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

type RagSourceLabelProps = {
  source: string;
};

export const RagSourceLabel = ({ source }: RagSourceLabelProps) => (
  <Box component="span" sx={ragSourceLabelSx}>
    {source}
  </Box>
);
