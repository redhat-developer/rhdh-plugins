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

import React from 'react';
import { Button } from '@material-ui/core';
import { DcmFormDialog } from '../../../components/DcmFormDialog';
import { EnvironmentFormFields } from './EnvironmentFormFields';
import type { EnvironmentRegisterFormState } from './environmentFormTypes';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  form: EnvironmentRegisterFormState;
  setForm: React.Dispatch<React.SetStateAction<EnvironmentRegisterFormState>>;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
}>;

export function EditEnvironmentDialog({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  isSubmitDisabled,
}: Props) {
  return (
    <DcmFormDialog
      open={open}
      onClose={onClose}
      title="Edit environment"
      actions={
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
          >
            Save
          </Button>
          <Button variant="outlined" color="primary" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <EnvironmentFormFields form={form} setForm={setForm} mode="edit" />
    </DcmFormDialog>
  );
}
