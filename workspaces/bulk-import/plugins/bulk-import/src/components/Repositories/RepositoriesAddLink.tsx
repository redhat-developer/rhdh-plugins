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

import { Link } from '@backstage/core-components';
import { Alert, Button, Flex } from '@backstage/ui';

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
          <Alert
            status="danger"
            icon
            title={t('repositories.errorOccuredWhileFetching')}
            description={`${status?.title} ${status?.url}`}
            customActions={
              <Button variant="tertiary" onPress={handleCloseAlert}>
                {t('common.close')}
              </Button>
            }
          />
          <br />
        </>
      )}
      <Flex
        justify="end"
        style={{
          marginBottom: '24px',
        }}
      >
        <Link to="add">
          <Button variant="primary" data-testid="add-repository">
            {gitlabConfigured ? t('common.import') : t('common.add')}
          </Button>
        </Link>
      </Flex>
    </>
  );
};
