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
import { ServiceSpecFormFields } from './ServiceSpecFormFields';
import type { SpecFormState } from './specFormTypes';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  form: SpecFormState;
  setForm: React.Dispatch<React.SetStateAction<SpecFormState>>;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  togglePolicyPack: (
    setForm: React.Dispatch<React.SetStateAction<SpecFormState>>,
    pack: string,
  ) => void;
}>;

export function ServiceSpecEditDialog({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  isSubmitDisabled,
  togglePolicyPack,
}: Props) {
  return (
    <DcmFormDialog
      open={open}
      onClose={onClose}
      title="Edit service spec"
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
      <ServiceSpecFormFields
        form={form}
        setForm={setForm}
        idPrefix="edit-spec"
        togglePolicyPack={togglePolicyPack}
      />
    </DcmFormDialog>
  );
}
