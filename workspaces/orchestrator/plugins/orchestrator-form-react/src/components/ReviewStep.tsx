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

import { useMemo, useState } from 'react';

import { Content } from '@backstage/core-components';
import { JsonObject } from '@backstage/types';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { ReviewComponentProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import { useTranslation } from '../hooks/useTranslation';
import generateReviewTableData from '../utils/generateReviewTableData';
import { schemaHasUiHiddenFields } from '../utils/schemaHasUiHiddenFields';
import NestedReviewTable from './NestedReviewTable';
import SubmitButton from './SubmitButton';

const useStyles = makeStyles()(theme => ({
  backButton: {
    marginRight: theme.spacing(1),
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right',
    marginTop: theme.spacing(2),
  },
  paper: {
    // Workaround since the StructuredMetadataTable is neither responsive as it simply uses <table> nor can be customized via props or styles.
    '& > table > tbody > tr': {
      '& > td:nth-child(1)': {
        minWidth: '10rem',
        width: '25%',
      },
      '& > td:nth-child(2)': {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'left',
      },
    },
  },
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

const ReviewStep = ({
  busy,
  schema,
  data,
  handleBack,
  handleExecute,
}: ReviewComponentProps) => {
  const { t } = useTranslation();

  const { classes } = useStyles();
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const displayData = useMemo<JsonObject>(() => {
    return generateReviewTableData(schema, data, {
      includeHiddenFields: showHiddenFields,
    });
  }, [schema, data, showHiddenFields]);

  const showHiddenFieldsNote = useMemo(() => {
    return schemaHasUiHiddenFields(schema);
  }, [schema]);

  return (
    <Content noPadding>
      <Paper square elevation={0} className={classes.paper}>
        {showHiddenFieldsNote && (
          <Alert
            severity="info"
            className={classes.hiddenFieldsAlert}
            action={
              <FormControlLabel
                className={classes.hiddenFieldsAction}
                control={
                  <Switch
                    checked={showHiddenFields}
                    onChange={event =>
                      setShowHiddenFields(event.target.checked)
                    }
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
        )}
        <NestedReviewTable data={displayData} />
        <Box mb={4} />
        <div className={classes.footer}>
          <Button
            onClick={handleBack}
            className={classes.backButton}
            disabled={busy}
          >
            {t('common.back')}
          </Button>
          <SubmitButton
            handleClick={handleExecute}
            submitting={busy}
            focusOnMount
          >
            {t('common.run')}
          </SubmitButton>
        </div>
      </Paper>
    </Content>
  );
};

export default ReviewStep;
