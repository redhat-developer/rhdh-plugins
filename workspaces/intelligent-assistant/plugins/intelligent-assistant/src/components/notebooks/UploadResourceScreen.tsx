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

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Button, Spinner } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons';

import { useTranslation } from '../../hooks/useTranslation';

const Container = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  textAlign: 'center',
  gap: theme.spacing(2),
}));

const EmptyIcon = styled(CatalogIcon)({
  fontSize: 48,
  color: 'var(--pf-t--global--icon--color--subtle)',
  '& > .pf-v6-icon-rh-ui': {
    display: 'none !important',
  },
});

const Heading = styled(Typography)({
  fontWeight: 500,
  fontSize: '1.5rem',
  lineHeight: '2rem',
  letterSpacing: '-0.25px',
});

const UploadButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 999,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
}));

type UploadResourceScreenProps = {
  onUploadClick: () => void;
  isProcessing?: boolean;
};

export const UploadResourceScreen = ({
  onUploadClick,
  isProcessing = false,
}: UploadResourceScreenProps) => {
  const { t } = useTranslation();
  return (
    <Container>
      <EmptyIcon />
      {isProcessing ? (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Spinner size="md" />
            <Heading>{t('notebook.view.processing.heading')}</Heading>
          </Box>
          <Typography
            sx={{
              color: 'var(--pf-t--global--text--color--subtle)',
              maxWidth: 400,
            }}
          >
            {t('notebook.view.processing.description')}
          </Typography>
        </>
      ) : (
        <>
          <Heading>{t('notebook.view.upload.heading')}</Heading>
          <UploadButton
            variant="secondary"
            icon={<AddCircleOIcon />}
            iconPosition="start"
            onClick={onUploadClick}
          >
            {t('notebook.view.upload.action')}
          </UploadButton>
        </>
      )}
    </Container>
  );
};
