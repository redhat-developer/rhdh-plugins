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

import { Button, CircularProgress } from '@material-ui/core';

export type DcmFormDialogActionsProps = Readonly<{
  /** Called when the primary (submit) button is clicked. */
  onSubmit: () => void;
  /** Called when the Cancel button is clicked. */
  onCancel: () => void;
  /** Label for the primary action button. */
  submitLabel: string;
  /** When true, shows a spinner in the primary button and disables both buttons. */
  submitting: boolean;
  /**
   * When true, the primary button is disabled (in addition to the
   * `submitting` state). Use this to reflect form validity.
   */
  disabled: boolean;
}>;

/**
 * Standardised Save / Cancel action row for DCM form dialogs.
 */
export function DcmFormDialogActions({
  onSubmit,
  onCancel,
  submitLabel,
  submitting,
  disabled,
}: DcmFormDialogActionsProps) {
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={onSubmit}
        disabled={disabled || submitting}
        startIcon={
          submitting ? (
            <CircularProgress size={16} color="inherit" />
          ) : undefined
        }
      >
        {submitting ? 'Saving\u2026' : submitLabel}
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={onCancel}
        disabled={submitting}
      >
        Cancel
      </Button>
    </>
  );
}
