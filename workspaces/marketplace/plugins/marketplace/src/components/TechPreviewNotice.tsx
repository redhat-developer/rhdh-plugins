/*
 * Copyright The Backstage Authors
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
import * as React from 'react';

import { Header } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

/**
 * A clickable chip that shows a popover with a tech preview notice.
 */
export const TechPreviewChip = () => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'marketplace-tech-preview-popover' : undefined;

  return (
    <div>
      <Button
        aria-describedby={id}
        variant="contained"
        onClick={handleClick}
        startIcon={<InfoIcon />}
        color="error"
        sx={{ borderRadius: 99 }}
      >
        Tech preview
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ maxWidth: 400 }}>
          <Typography sx={{ px: 2, pt: 2 }}>
            This feature is still in a Preview pre-release stage. You might find
            bugs or issues with availability, stability, data, or performance.
          </Typography>
          <Button
            variant="text"
            onClick={handleClose}
            sx={{ m: 1 }}
            endIcon={<OpenInNewIcon />}
            component="a"
            href="https://access.redhat.com/support/offerings/techpreview"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more about Tech Preview (opens in new tab)"
          >
            Learn more
          </Button>
        </Box>
      </Popover>
    </div>
  );
};

/**
 * A Backstage header with a tech preview notice.
 */
export const TechPreviewHeader = (
  props: React.ComponentProps<typeof Header>,
) => (
  <Header
    {...props}
    pageTitleOverride={props.pageTitleOverride ?? String(props.title)}
    title={
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Box>{props.title}</Box> <TechPreviewChip />
      </Box>
    }
  />
);
