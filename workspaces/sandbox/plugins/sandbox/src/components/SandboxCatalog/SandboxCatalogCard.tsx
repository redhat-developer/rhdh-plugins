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
import { useApi } from '@backstage/core-plugin-api';
import { aapApiRef, kubeApiRef } from '../../api';
import { Product } from './productData';
import { signupDataToStatus } from '../../utils/register-utils';
import { productsURLMapping } from '../../hooks/useProductURLs';

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
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0E1214',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  }
  return (
    <Tooltip title="Tried" placement="top" arrow>
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
  let { userData, userFound, userReady, verificationRequired } =
    useSandboxContext();
  const { handleAAPInstance, signupUser, refetchUserData, refetchAAP } =
    useSandboxContext();
  const [ansibleCredsModalOpen, setAnsibleCredsModalOpen] =
    React.useState(false);
  const [verifyPhoneModalOpen, setVerifyPhoneModalOpen] = useState(false);
  const [refetchingUserData, setRefetchingUserData] = useState(false);
  const [deleteAnsibleModalOpen, setDeleteAnsibleModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTryButtonClick = async (pdt: Product) => {
    // User is not yet signed up
    let urlToOpen = link;
    if (!userFound) {
      signupUser();

      const maxAttempts = 5;
      const retryInterval = 1000; // 1 second

      // Poll until user is found or max attempts reached
      for (let i = 0; i < maxAttempts; i++) {
        setRefetchingUserData(true);
        await new Promise(resolve => setTimeout(resolve, retryInterval));

        try {
          // Fetch the latest user data and check if user is found
          userData = await refetchUserData();
          if (userData) {
            userFound = true;
            const userStatus = signupDataToStatus(userData);
            verificationRequired = userStatus === 'verify';
            userReady = userStatus === 'ready';
            const userNamespaceReady =
              userData?.defaultUserNamespace !== undefined;
            // if user is ready or verification is required we can stop fetching the data
            if ((userReady || verificationRequired) && userNamespaceReady) {
              const productURLs = productsURLMapping(userData);
              // find the link to open if any
              urlToOpen = productURLs.find(pu => pu.id === id)?.url || '';
              if (urlToOpen && !verificationRequired) {
                // open url if user is ready and no further verification is required
                window.open(urlToOpen, '_blank');
                showGreenCorner();
              }
              break;
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error fetching user data:', error);
        } finally {
          setRefetchingUserData(false);
        }
      }
    }

    // User has signed up but require verification
    if (userFound && verificationRequired) {
      setVerifyPhoneModalOpen(true);
      return;
    }

    // User has signed up and the trial is ready and user selects the AAP Trial
    if (userFound && userReady && pdt === Product.AAP) {
      if (!userData?.defaultUserNamespace) {
        // eslint-disable-next-line
        console.error(
          'unable to provision AAP. user namespace is not defined.',
        );
        return;
      }
      handleAAPInstance(userData.defaultUserNamespace);
      setAnsibleCredsModalOpen(true);
      showGreenCorner();
    }
  };

  const handleDeleteButtonClick = async (pdt: Product) => {
    if (deleting) {
      return;
    }

    setDeleteAnsibleModalOpen(false);
    setDeleting(true);
    const userNamespace = userData?.defaultUserNamespace;
    if (!userNamespace) {
      // eslint-disable-next-line
      console.error(
        'unable to delete aap instance. user namespace is undefined',
      );
      return;
    }
    if (pdt === Product.AAP) {
      refetchAAP(userNamespace);
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
        await aapApi.deleteAAPCR(userNamespace);
        await kubeApi.deleteSecretsAndPVCs(aapDeployments, userNamespace);
        await kubeApi.deleteSecretsAndPVCs(aapStatefulSets, userNamespace);
        await kubeApi.deletePVCsForSTS(aapStatefulSets, userNamespace);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
    refetchAAP(userNamespace);
    setDeleting(false);
  };

  return (
    <>
      <Card
        data-testid="catalog-card"
        elevation={0}
        key={id}
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0E1214',
        }}
      >
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
        <CardContent
          style={{
            padding: `0 ${theme.spacing(3)}`,
            backgroundColor: 'transparent',
          }}
        >
          {description?.map(point => (
            <Typography
              key={point.value}
              component="div"
              color="textPrimary"
              style={{ fontSize: '14px', paddingBottom: '8px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '5px',
                }}
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
            title={title}
            handleTryButtonClick={handleTryButtonClick}
            theme={theme}
            refetchingUserData={refetchingUserData}
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
        id={id}
        modalOpen={verifyPhoneModalOpen}
        setOpen={setVerifyPhoneModalOpen}
        setAnsibleCredsModalOpen={setAnsibleCredsModalOpen}
        setRefetchingUserData={setRefetchingUserData}
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
