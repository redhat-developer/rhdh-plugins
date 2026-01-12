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

import { LinkButton } from '@backstage/core-components';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import { useFormikContext } from 'formik';

import { useGitlabConfigured } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoriesFormValues } from '../../types';

export const RepositoriesAddLink = () => {
  const { t } = useTranslation();
  const { status, setStatus } = useFormikContext<AddRepositoriesFormValues>();

  const handleCloseAlert = () => {
    setStatus(null);
  };

  const gitlabConfigured = useGitlabConfigured();
  return (
    <>
      {(status?.title || status?.url) && (
        <>
          <Alert severity="error" onClose={() => handleCloseAlert()}>
            <AlertTitle>
              {t('repositories.errorOccuredWhileFetching')}
            </AlertTitle>
            {`${status?.title} ${status?.url}`}
          </Alert>
          <br />
        </>
      )}
      <Typography
        sx={{
          display: 'flex',
          justifyContent: 'end',
          marginBottom: '24px !important',
        }}
      >
        <LinkButton
          to="add"
          color="primary"
          variant="contained"
          data-testid="add-repository"
        >
          {gitlabConfigured ? t('common.import') : t('common.add')}
        </LinkButton>
      </Typography>
    </>
  );
};
