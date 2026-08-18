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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles()(theme => ({
  hiddenFieldsAlert: {
    marginBottom: theme.spacing(2),
  },
  hiddenFieldsAction: {
    marginLeft: theme.spacing(2),
  },
  hiddenFieldsText: {
    fontSize: theme.typography.body1.fontSize,
  },
}));

/**
 * @public
 */
export type ReviewHiddenParametersAlertProps = {
  /** When true, `ui:hidden` fields are included in the review table. */
  showHiddenFields: boolean;
  /** Invoked when the user toggles “show hidden parameters”. */
  onShowHiddenFieldsChange: (includeHidden: boolean) => void;
};

/**
 * Info alert and switch to include `ui:hidden` fields in the review table (shared by default and custom review UIs).
 *
 * @public
 */
export const ReviewHiddenParametersAlert = ({
  showHiddenFields,
  onShowHiddenFieldsChange,
}: ReviewHiddenParametersAlertProps) => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  return (
    <Alert
      severity="info"
      className={classes.hiddenFieldsAlert}
      action={
        <FormControlLabel
          className={classes.hiddenFieldsAction}
          control={
            <Switch
              checked={showHiddenFields}
              onChange={event => onShowHiddenFieldsChange(event.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography className={classes.hiddenFieldsText}>
              {t('reviewStep.showHiddenParameters')}
            </Typography>
          }
        />
      }
    >
      <Typography className={classes.hiddenFieldsText}>
        {t('reviewStep.hiddenFieldsNote')}
      </Typography>
    </Alert>
  );
};
