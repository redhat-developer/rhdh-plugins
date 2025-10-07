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

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import FormControl from '@mui/material/FormControl';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoriesFormValues, PullRequestPreviewData } from '../../types';
import { useDrawer } from '../DrawerContext';
import { PreviewFileSidebar } from '../PreviewFile/PreviewFileSidebar';
import { AddRepositoriesFormFooter } from './AddRepositoriesFormFooter';
import { AddRepositoriesTable } from './AddRepositoriesTable';

export const AddRepositories = ({ error }: { error: any }) => {
  const { t } = useTranslation();
  const { openDrawer, setOpenDrawer, drawerData } = useDrawer();
  const { setFieldValue, values } =
    useFormikContext<AddRepositoriesFormValues>();
  const closeDrawer = () => {
    setOpenDrawer(false);
  };

  const handleSave = (pullRequest: PullRequestPreviewData, _event: any) => {
    Object.keys(pullRequest).forEach(pr => {
      setFieldValue(
        `repositories.${pr}.catalogInfoYaml.prTemplate`,
        pullRequest[pr],
      );
    });
    setOpenDrawer(false);
  };

  const errorMessage = error?.error?.message && JSON.parse(error.error.message);

  return (
    <>
      <FormControl fullWidth>
        <div
          style={{
            marginBottom: '50px',
            padding: '24px',
          }}
        >
          {error && (
            <div style={{ paddingBottom: '10px' }}>
              <Alert severity="error">
                <AlertTitle>
                  {errorMessage?.error?.name ??
                    error?.error?.name ??
                    t('errors.errorOccurred')}
                </AlertTitle>
                {errorMessage?.error?.message ??
                  error?.err ??
                  t('errors.failedToCreatePullRequest')}
              </Alert>
            </div>
          )}
          <AddRepositoriesTable />
        </div>
        <br />
      </FormControl>
      <AddRepositoriesFormFooter />
      {openDrawer && (
        <PreviewFileSidebar
          open={openDrawer}
          onClose={closeDrawer}
          data={drawerData}
          repositoryType={values.repositoryType}
          handleSave={handleSave}
        />
      )}
    </>
  );
};
