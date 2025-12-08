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

import { useMemo } from 'react';

import { Content } from '@backstage/core-components';
import { JsonObject } from '@backstage/types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import type { JSONSchema7 } from 'json-schema';
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
}));

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
  const displayData = useMemo<JsonObject>(() => {
    return generateReviewTableData(schema, data);
  }, [schema, data]);

  return (
    <Content noPadding>
      <Paper square elevation={0} className={classes.paper}>
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
