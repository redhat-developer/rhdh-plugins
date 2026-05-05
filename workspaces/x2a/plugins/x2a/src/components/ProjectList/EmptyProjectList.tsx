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
import { makeStyles } from '@material-ui/core';
import { EmptyState, LinkButton, Progress } from '@backstage/core-components';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  CREATE_PROJECT_TEMPLATE_PATH,
  x2aAdminViewPermission,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import emptyProjectListImage from './EmptyProjectListImage.png';
import { useTranslation } from '../../hooks/useTranslation';

const useStyles = makeStyles({
  top: {
    '& > div:first-child > div:first-child': {
      margin: 'auto',
    },
  },
  nextSteps: {
    marginTop: '16px',
  },
});

export const EmptyProjectListImage = () => (
  <img
    src={emptyProjectListImage}
    alt="Empty project list"
    style={{ maxWidth: '100%', height: 'auto' }}
  />
);

const NextSteps = ({ canCreate }: { canCreate: boolean }) => {
  const { t } = useTranslation();
  const styles = useStyles();

  return (
    <div>
      {t('emptyPage.noConversionInitiatedYetDescription')}
      <div className={styles.nextSteps}>
        <LinkButton
          variant="contained"
          color="primary"
          to={CREATE_PROJECT_TEMPLATE_PATH}
          disabled={!canCreate}
        >
          {t('emptyPage.startFirstConversion')}
        </LinkButton>
      </div>
    </div>
  );
};

export const EmptyProjectList = () => {
  const { t } = useTranslation();
  const styles = useStyles();

  const isUserPermission = usePermission({
    permission: x2aUserPermission,
  });
  const isAdminReadPermission = usePermission({
    permission: x2aAdminViewPermission,
  });
  const isAdminWritePermission = usePermission({
    permission: x2aAdminWritePermission,
  });

  if (
    isUserPermission.loading ||
    isAdminReadPermission.loading ||
    isAdminWritePermission.loading
  ) {
    return <Progress />;
  }

  const isViewAllowed =
    isUserPermission.allowed ||
    isAdminReadPermission.allowed ||
    isAdminWritePermission.allowed;
  const canCreate = isAdminWritePermission.allowed || isUserPermission.allowed;

  if (!isViewAllowed) {
    return (
      <div className={styles.top}>
        <EmptyState
          title={t('emptyPage.notAllowedTitle')}
          description={t('emptyPage.notAllowedDescription')}
          missing={{ customImage: <EmptyProjectListImage /> }}
        />
      </div>
    );
  }

  return (
    <div className={styles.top}>
      <EmptyState
        title={t('emptyPage.noConversionInitiatedYet')}
        description={<NextSteps canCreate={canCreate} />}
        missing={{ customImage: <EmptyProjectListImage /> }}
      />
    </div>
  );
};
