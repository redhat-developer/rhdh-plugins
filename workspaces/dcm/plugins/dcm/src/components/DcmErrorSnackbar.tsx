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

export type DcmErrorSnackbarProps = Readonly<{
  /** The error message to display, or null/undefined when there is no error. */
  error: string | null | undefined;
  /** Called when the snackbar is dismissed. Use this to clear the error state. */
  onClose: () => void;
  /** Auto-hide duration in milliseconds. Defaults to 8000. */
  autoHideDuration?: number;
}>;

/**
 * Displays a transient error notification at the bottom-center of the screen.
 * Renders nothing when `error` is falsy.
 */
export function DcmErrorSnackbar({
  error,
  onClose,
  autoHideDuration = 8000,
}: DcmErrorSnackbarProps) {
  return (
    <Snackbar
      open={Boolean(error)}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <MuiAlert
        onClose={onClose}
        severity="error"
        elevation={6}
        variant="filled"
      >
        {error}
      </MuiAlert>
    </Snackbar>
  );
}
