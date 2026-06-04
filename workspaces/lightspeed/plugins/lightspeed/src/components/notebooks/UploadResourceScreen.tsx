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

const HeadingRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

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
      <CatalogIcon
        style={{
          fontSize: 48,
          color: 'var(--pf-t--global--icon--color--subtle)',
        }}
      />
      {isProcessing ? (
        <>
          <HeadingRow>
            <Spinner size="md" />
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '1.5rem',
                lineHeight: '2rem',
                letterSpacing: '-0.25px',
              }}
            >
              {t('notebook.view.processing.heading')}
            </Typography>
          </HeadingRow>
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
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '1.5rem',
              lineHeight: '2rem',
              letterSpacing: '-0.25px',
            }}
          >
            {t('notebook.view.upload.heading')}
          </Typography>
          <UploadButton
            variant="secondary"
            icon={<AddCircleOIcon />}
            iconPosition="end"
            onClick={onUploadClick}
          >
            {t('notebook.view.upload.action')}
          </UploadButton>
        </>
      )}
    </Container>
  );
};
