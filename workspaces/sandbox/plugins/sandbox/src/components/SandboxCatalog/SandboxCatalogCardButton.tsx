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
import { useTrackAnalytics } from '../../utils/eddl-utils';
import { Intcmp } from '../../hooks/useProductURLs';

type SandboxCatalogCardButtonProps = {
  link: string;
  id: Product;
  title: string;
  handleTryButtonClick: (id: Product) => void;
  theme: Theme;
  refetchingUserData?: boolean;
};

export const SandboxCatalogCardButton: React.FC<
  SandboxCatalogCardButtonProps
> = ({ link, id, title, handleTryButtonClick, theme, refetchingUserData }) => {
  const { loading, userFound, verificationRequired, userReady, ansibleStatus } =
    useSandboxContext();
  const [clicked, setClicked] = React.useState(false);
  const trackAnalytics = useTrackAnalytics();

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

  // Get the intcmp parameter for this product
  const getIntcmpFromProduct = (productId: Product): string | undefined => {
    switch (productId) {
      case Product.OPENSHIFT_CONSOLE:
        return Intcmp.OPENSHIFT_CONSOLE;
      case Product.DEVSPACES:
        return Intcmp.DEVSPACES;
      case Product.OPENSHIFT_AI:
        return Intcmp.RHODS;
      case Product.OPENSHIFT_VIRT:
        return Intcmp.OPENSHIFT_VIRT;
      case Product.AAP:
        return Intcmp.AAP;
      default:
        return undefined;
    }
  };

  const intcmp = getIntcmpFromProduct(id);

  // Handle CTA click for analytics
  const handleCtaClick = async () => {
    await trackAnalytics(title, 'Catalog', link, intcmp, 'cta');
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
    <Link
      to={link}
      underline="none"
      onClick={handleCtaClick}
      data-analytics-track-by-analytics-manager="false"
    >
      {buttonContent}
    </Link>
  ) : (
    // When there's no link, we push CTA event on button click
    <Button
      size="medium"
      color="primary"
      variant="outlined"
      onClick={() => {
        if (!loading) {
          handleClick();
          handleCtaClick();
        }
      }}
      endIcon={endIcon}
      sx={buttonSx}
      data-analytics-track-by-analytics-manager="false"
    >
      {label}
    </Button>
  );
};
