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
import React, { useContext, useState } from 'react';
import { E164Number } from 'libphonenumber-js/types.cjs';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import DoneIcon from '@mui/icons-material/Done';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link } from '@backstage/core-components';
import { PhoneVerificationModal } from '../Modals/PhoneVerificationModal';
import { VerificationCodeInputModal } from '../Modals/VerificationCodeInputModal';
import { AnsibleLaunchInfoModal } from '../Modals/AnsibleLaunchInfoModal';
import { Context } from './SandboxCatalogPage';

type SandboxCatalogCardProps = {
  key: React.Key;
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
  key,
  title,
  image,
  description,
  link,
  greenCorner,
  showGreenCorner,
}) => {
  const theme = useTheme();
  const [, setButtonClicked] = useContext(Context);
  const [buttonText, setButtonText] = useState<string>('Try it');
  const [phoneVerificationModalOpen, setPhoneVerificationModalOpen] =
    React.useState(false);
  const [verificationCodeModalOpen, setVerificationCodeModalOpen] =
    React.useState(false);
  const [ansibleCredsModalOpen, setAnsibleCredsModalOpen] =
    React.useState(false);
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();

  const handleTryButtonClick = () => {
    setButtonText('Provisioning...');
    setButtonClicked(true);
    showGreenCorner();
    setPhoneVerificationModalOpen(true);
    // setAnsibleCredsModalOpen(true);
  };

  return (
    <>
      <Card elevation={0} key={key} sx={{ width: '100%', height: '100%' }}>
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
          <Link to={link} underline="none">
            <Button
              size="medium"
              color="primary"
              variant="outlined"
              endIcon={<OpenInNewIcon />}
              onClick={handleTryButtonClick}
              sx={{
                border: `1px solid ${theme.palette.primary.main}`,
                marginTop: theme.spacing(0.5),
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  borderColor: '#1976d2',
                },
              }}
            >
              {buttonText}
            </Button>
          </Link>
        </CardActions>
      </Card>
      <PhoneVerificationModal
        open={phoneVerificationModalOpen}
        setOpen={setPhoneVerificationModalOpen}
        showOtpModal={setVerificationCodeModalOpen}
        setPhoneNumber={setPhoneNumber}
        phoneNumber={phoneNumber}
      />
      <VerificationCodeInputModal
        open={verificationCodeModalOpen}
        setOpen={setVerificationCodeModalOpen}
        showPhoneModal={setPhoneVerificationModalOpen}
        phoneNumber={phoneNumber}
      />
      <AnsibleLaunchInfoModal
        open={ansibleCredsModalOpen}
        setOpen={setAnsibleCredsModalOpen}
      />
    </>
  );
};
