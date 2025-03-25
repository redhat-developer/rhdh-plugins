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
import Button from '@mui/material/Button';
import { Theme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../utils/aap-utils';
import { Product } from './productData';

type SandboxCatalogCardDeleteButtonProps = {
  id: Product;
  handleDeleteButtonClick: (id: Product) => void;
  theme: Theme;
  isDeleting: boolean;
};

export const SandboxCatalogCardDeleteButton: React.FC<
  SandboxCatalogCardDeleteButtonProps
> = ({ id, handleDeleteButtonClick, theme, isDeleting }) => {
  const { ansibleStatus } = useSandboxContext();

  if (
    id === Product.AAP &&
    (ansibleStatus === AnsibleStatus.READY ||
      ansibleStatus === AnsibleStatus.PROVISIONING)
  ) {
    return (
      <Button
        size="medium"
        color="primary"
        variant="contained"
        onClick={() => {
          handleDeleteButtonClick(id);
        }}
        endIcon={
          isDeleting && (
            <CircularProgress
              size={20}
              sx={{ color: theme.palette.common.white }}
            />
          )
        }
        sx={{
          marginTop: theme.spacing(0.5),
        }}
      >
        {ansibleStatus === AnsibleStatus.PROVISIONING ? 'Stop' : 'Delete'}
      </Button>
    );
  }
  return null;
};
