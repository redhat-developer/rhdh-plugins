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
import type { JSONSchema7 } from 'json-schema';
import { get } from 'lodash';
import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../hooks/useTranslation';
import generateReviewTableData from '../utils/generateReviewTableData';
import { useStepperContext } from '../utils/StepperContext';
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

/**
 * Recursively checks if the schema contains any fields with ui:hidden property
 */
const hasHiddenFields = (schema: JSONSchema7): boolean => {
  if (typeof schema === 'boolean') {
    return false;
  }

  // Check if this schema itself is hidden
  if (get(schema, 'ui:hidden')) {
    return true;
  }

  // Check properties
  if (schema.properties) {
    for (const prop of Object.values(schema.properties)) {
      if (typeof prop !== 'boolean' && hasHiddenFields(prop)) {
        return true;
      }
    }
  }

  // Check items (for arrays)
  if (schema.items && typeof schema.items !== 'boolean') {
    if (Array.isArray(schema.items)) {
      for (const item of schema.items) {
        if (typeof item !== 'boolean' && hasHiddenFields(item)) {
          return true;
        }
      }
    } else if (hasHiddenFields(schema.items)) {
      return true;
    }
  }

  return false;
};

const ReviewStep = ({
  busy,
  schema,
  data,
  handleExecute,
}: {
  busy: boolean;
  schema: JSONSchema7;
  data: JsonObject;
  handleExecute: () => void;
}) => {
  const { t } = useTranslation();

  const { classes } = useStyles();
  const { handleBack } = useStepperContext();
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const displayData = useMemo<JsonObject>(() => {
    return generateReviewTableData(schema, data, {
      includeHiddenFields: showHiddenFields,
    });
  }, [schema, data, showHiddenFields]);

  const showHiddenFieldsNote = useMemo(() => {
    return hasHiddenFields(schema);
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
