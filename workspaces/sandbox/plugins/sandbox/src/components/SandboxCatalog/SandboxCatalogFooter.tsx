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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Link } from '@backstage/core-components';
import { AccessCodeInputModal } from '../Modals/AccessCodeInputModal';
import { useSandboxContext } from '../../hooks/useSandboxContext';

export const SandboxCatalogFooter = () => {
  const theme = useTheme();
  const [accessCodeModalOpen, setAccessCodeModalOpen] = React.useState(false);
  const { userData } = useSandboxContext();

  // Hide the footer if the user has started trial
  if (userData) {
    return null;
  }

  const handleClick = () => {
    setAccessCodeModalOpen(true);
  };

  return (
    <>
      <Box
        component="footer"
        sx={{
          padding: theme.spacing(2),
          backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0E1214',
        }}
      >
        <Typography variant="body1" color="textPrimary" align="center">
          Have an activation code?
          <Link to="#" onClick={handleClick} style={{ cursor: 'pointer' }}>
            {' '}
            Click here
          </Link>
        </Typography>
      </Box>
      <AccessCodeInputModal
        modalOpen={accessCodeModalOpen}
        setOpen={setAccessCodeModalOpen}
      />
    </>
  );
};
