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
import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import DoneIcon from '@mui/icons-material/Done';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import { SandboxCatalogCardButton } from './SandboxCatalogCardButton';
import { SandboxCatalogCardDeleteButton } from './SandboxCatalogCardDeleteButton';
import {
  AnsibleDeleteInstanceModal,
  AnsibleLaunchInfoModal,
  PhoneVerificationModal,
} from '../Modals';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../utils/aap-utils';
import { useApi } from '@backstage/core-plugin-api';
import { aapApiRef, kubeApiRef } from '../../api';
import { Product } from './productData';

type SandboxCatalogCardProps = {
  id: Product;
  title: string;
  image: string;
  description: {
    icon: React.ReactNode;
    value: string;
  }[];
  link: string;
  greenCorner: boolean;
  showGreenCorner: () => void;
};

const CatalogCardGreenCorner = ({ show }: { show: boolean }) => {
  const theme = useTheme();
  if (!show) {
    return (
      // Empty box to keep the layout consistent
      <Box
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#1b1d21',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  }
  return (
    <Tooltip title="Product you tried" placement="top" arrow>
      <Box
        style={{
          width: '32px',
          height: '32px',
          backgroundColor:
            theme.palette.mode === 'light' ? '#73C5C5' : '#009596',
          clipPath: 'polygon(0 0, 100% 0, 0 100%)', // Creates a triangle
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DoneIcon
          sx={{
            color: theme.palette.common.white,
            fontSize: '12px',
            position: 'relative',
            top: '-6px',
            left: '-6px',
          }}
        />
      </Box>
    </Tooltip>
  );
};

export const SandboxCatalogCard: React.FC<SandboxCatalogCardProps> = ({
  id,
  title,
  image,
  description,
  link,
  greenCorner,
  showGreenCorner,
}) => {
  const theme = useTheme();
  const kubeApi = useApi(kubeApiRef);
  const aapApi = useApi(aapApiRef);
  const {
    userData,
    ansibleData,
    ansibleStatus,
    signupUser,
    userFound,
    userReady,
    verificationRequired,
    refetchUserData,
    refetchAAP,
  } = useSandboxContext();
  const [ansibleCredsModalOpen, setAnsibleCredsModalOpen] =
    React.useState(false);
  const [verifyPhoneModalOpen, setVerifyPhoneModalOpen] = useState(false);

  const [deleteAnsibleModalOpen, setDeleteAnsibleModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleAAPInstance: () => Promise<void> = async () => {
    refetchAAP();

    if (
      ansibleStatus === AnsibleStatus.PROVISIONING ||
      ansibleStatus === AnsibleStatus.READY
    ) {
      return;
    }

    if (
      ansibleStatus === AnsibleStatus.IDLED &&
      ansibleData &&
      ansibleData?.items?.length > 0
    ) {
      try {
        await aapApi.unIdleAAP(userData?.defaultUserNamespace || '');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
      return;
    }
    try {
      await aapApi.createAAP(userData?.defaultUserNamespace || '');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const handleTryButtonClick = async (pdt: Product) => {
    // User is not yet signed up
    if (!userFound) {
      signupUser();
      refetchUserData();
    }
    // User has signed up but require verification
    if (userFound && verificationRequired) {
      setVerifyPhoneModalOpen(true);
    }
    // User has signed up and the trial is ready and user selects the AAP Trial
    if (userFound && userReady && pdt === Product.AAP) {
      await handleAAPInstance();
      refetchAAP();
      setAnsibleCredsModalOpen(true);
    }
    showGreenCorner();
  };

  const handleDeleteButtonClick = async (pdt: Product) => {
    if (deleting) {
      return;
    }

    setDeleteAnsibleModalOpen(false);
    setDeleting(true);
    if (pdt === Product.AAP) {
      refetchAAP();
      const userNamespace = userData?.defaultUserNamespace || '';
      const aapLabelSelector =
        'app.kubernetes.io%2Fmanaged-by+in+%28aap-gateway-operator%2Caap-operator%2Cautomationcontroller-operator%2Cautomationhub-operator%2Ceda-operator%2Clightspeed-operator%29&limit=50';

      try {
        const aapDeployments = await kubeApi.getDeployments(
          userNamespace,
          aapLabelSelector,
        );
        const aapStatefulSets = await kubeApi.getStatefulSets(
          userNamespace,
          aapLabelSelector,
        );
        await aapApi.deleteAAPCR(userData?.defaultUserNamespace || '');
        await kubeApi.deleteSecretsAndPVCs(aapDeployments, userNamespace);
        await kubeApi.deleteSecretsAndPVCs(aapStatefulSets, userNamespace);
        await kubeApi.deletePVCsForSTS(aapStatefulSets, userNamespace);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
    refetchAAP();
    setDeleting(false);
  };

  return (
    <>
      <Card elevation={0} key={id} sx={{ width: '100%', height: '100%' }}>
        <CatalogCardGreenCorner show={greenCorner} />
        <CardMedia
          sx={{
            padding: `0 ${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(
              3,
            )}`,
          }}
        >
          <Stack
            direction="row"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <img
              src={image}
              alt={title}
              style={{ width: '48px', height: '48px' }}
            />
            <Typography
              variant="h5"
              style={{ fontSize: '16px', fontWeight: 700, width: '12rem' }}
            >
              {title}
            </Typography>
          </Stack>
        </CardMedia>
        <CardContent style={{ padding: `0 ${theme.spacing(3)}` }}>
          {description?.map(point => (
            <Typography
              key={point.value}
              color="textPrimary"
              style={{ fontSize: '14px', paddingBottom: '8px' }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {point.icon} {point.value}
              </div>
            </Typography>
          ))}
        </CardContent>
        <CardActions
          sx={{
            justifyContent: 'flex-start',
            padding: `0 ${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(
              3,
            )}`,
          }}
        >
          <SandboxCatalogCardButton
            link={link}
            id={id}
            handleTryButtonClick={handleTryButtonClick}
            theme={theme}
          />
          <SandboxCatalogCardDeleteButton
            id={id}
            theme={theme}
            handleDeleteButtonClick={() => setDeleteAnsibleModalOpen(true)}
            isDeleting={deleting}
          />
        </CardActions>
      </Card>
      <PhoneVerificationModal
        modalOpen={verifyPhoneModalOpen}
        setOpen={setVerifyPhoneModalOpen}
      />
      <AnsibleLaunchInfoModal
        modalOpen={ansibleCredsModalOpen}
        setOpen={setAnsibleCredsModalOpen}
      />
      <AnsibleDeleteInstanceModal
        modalOpen={deleteAnsibleModalOpen}
        setOpen={setDeleteAnsibleModalOpen}
        handleAnsibleDeleteInstance={() => handleDeleteButtonClick(id)}
      />
    </>
  );
};
