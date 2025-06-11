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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from '@backstage/core-components';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../utils/aap-utils';
import { Product } from './productData';

type SandboxCatalogCardButtonProps = {
  link: string;
  id: Product;
  handleTryButtonClick: (id: Product) => void;
  theme: Theme;
  refetchingUserData?: boolean;
};

export const SandboxCatalogCardButton: React.FC<
  SandboxCatalogCardButtonProps
> = ({ link, id, handleTryButtonClick, theme, refetchingUserData }) => {
  const { loading, userFound, verificationRequired, userReady, ansibleStatus } =
    useSandboxContext();
  const [clicked, setClicked] = React.useState(false);

  const handleClick = () => {
    if (!clicked) setClicked(true);
    handleTryButtonClick(id);
  };

  const label = (() => {
    if (id === Product.AAP) {
      if (ansibleStatus === AnsibleStatus.IDLED) {
        return 'Reprovision';
      }
      if (ansibleStatus === AnsibleStatus.PROVISIONING) {
        return 'Provisioning';
      }
      if (ansibleStatus === AnsibleStatus.READY) {
        return 'Launch';
      }
      return 'Provision';
    }
    return 'Try it';
  })();

  let endIcon;
  if (
    (loading && clicked) ||
    (userFound && !userReady && !verificationRequired && clicked) ||
    (refetchingUserData && clicked)
  ) {
    endIcon = <CircularProgress size={20} />;
  } else if (id !== Product.AAP) {
    endIcon = <OpenInNewIcon />;
  } else if (
    ansibleStatus === AnsibleStatus.UNKNOWN ||
    ansibleStatus === AnsibleStatus.PROVISIONING
  ) {
    endIcon = <CircularProgress size={20} />;
  } else {
    endIcon = null;
  }

  const buttonSx = {
    border: `1px solid ${
      theme.palette.mode === 'dark' ? '#92c5f9' : theme.palette.primary.main
    }`,
    marginTop: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.04)',
      borderColor: '#1976d2',
    },
  };

  const buttonContent = (
    <Button
      size="medium"
      color="primary"
      variant="outlined"
      onClick={() => {
        if (!loading) {
          handleClick();
        }
      }}
      endIcon={endIcon}
      sx={buttonSx}
    >
      {label}
    </Button>
  );

  return userFound && !loading && !verificationRequired ? (
    <Link to={link} underline="none">
      {buttonContent}
    </Link>
  ) : (
    buttonContent
  );
};
