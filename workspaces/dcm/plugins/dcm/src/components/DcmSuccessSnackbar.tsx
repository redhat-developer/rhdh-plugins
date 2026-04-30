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

import { Snackbar } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

export type DcmSuccessSnackbarProps = Readonly<{
  /** The message to display, or null/undefined when hidden. */
  message: string | null | undefined;
  onClose: () => void;
  autoHideDuration?: number;
}>;

/**
 * Displays a transient success notification at the bottom-center of the screen.
 */
export function DcmSuccessSnackbar({
  message,
  onClose,
  autoHideDuration = 6000,
}: DcmSuccessSnackbarProps) {
  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <MuiAlert
        onClose={onClose}
        severity="success"
        elevation={6}
        variant="filled"
      >
        {message}
      </MuiAlert>
    </Snackbar>
  );
}
