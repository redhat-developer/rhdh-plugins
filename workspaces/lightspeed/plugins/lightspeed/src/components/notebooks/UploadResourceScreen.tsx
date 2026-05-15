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

import { Typography } from '@material-ui/core';
import { Button } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons';

import { useTranslation } from '../../hooks/useTranslation';
import { makeStyles } from '../../utils/makeStyles';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
    gap: theme.spacing(2),
  },
  icon: {
    fontSize: 48,
    color: 'var(--pf-t--global--icon--color--subtle)',
  },
  heading: {
    fontWeight: 500,
    fontSize: '1.5rem',
    lineHeight: '2rem',
    letterSpacing: '-0.25px',
  },
  uploadButton: {
    textTransform: 'none',
    borderRadius: 999,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
}));

type UploadResourceScreenProps = {
  onUploadClick: () => void;
};

export const UploadResourceScreen = ({
  onUploadClick,
}: UploadResourceScreenProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.container}>
      <CatalogIcon className={classes.icon} />
      <Typography className={classes.heading}>
        {t('notebook.view.upload.heading')}
      </Typography>
      <Button
        variant="secondary"
        className={classes.uploadButton}
        icon={<AddCircleOIcon />}
        iconPosition="end"
        onClick={onUploadClick}
      >
        {t('notebook.view.upload.action')}
      </Button>
    </div>
  );
};
