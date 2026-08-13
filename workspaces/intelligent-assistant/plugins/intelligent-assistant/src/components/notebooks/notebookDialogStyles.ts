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

import type { Theme } from '@material-ui/core/styles';

export const notebookDialogStyles = (theme: Theme) =>
  ({
    dialogPaper: {
      borderRadius: 24,
      maxWidth: 578,
    },
    dialogPaperCompact: {
      borderRadius: 12,
      maxWidth: '300px',
    },
    dialogTitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 24px 16px',
    },
    dialogTitleCompact: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 16px 12px !important',
    },
    titleText: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: '1.625rem',
      letterSpacing: '-0.25px',
    },
    closeButton: {
      color: theme.palette.text.primary,
    },
    dialogContent: {
      padding: '0 24px 24px',
    },
    dialogContentCompact: {
      padding: '0 16px 16px !important',
    },
  }) as const;
