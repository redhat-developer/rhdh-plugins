/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';

import { Content, StructuredMetadataTable } from '@backstage/core-components';
import { JsonObject } from '@backstage/types';

import { Box, Button, makeStyles, Paper } from '@material-ui/core';
import type { JSONSchema7 } from 'json-schema';

import generateReviewTableData from '../utils/generateReviewTableData';
import { useStepperContext } from '../utils/StepperContext';
import SubmitButton from './SubmitButton';

const useStyles = makeStyles(theme => ({
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right',
    marginTop: theme.spacing(2),
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
  const styles = useStyles();
  const { handleBack } = useStepperContext();
  const displayData = React.useMemo<JsonObject>(() => {
    return generateReviewTableData(schema, data);
  }, [schema, data]);
  return (
    <Content noPadding>
      <Paper square elevation={0}>
        <StructuredMetadataTable dense metadata={displayData} />
        <Box mb={4} />
        <div className={styles.footer}>
          <Button onClick={handleBack} disabled={busy}>
            Back
          </Button>
          <SubmitButton
            handleClick={handleExecute}
            submitting={busy}
            focusOnMount
          >
            Run
          </SubmitButton>
        </div>
      </Paper>
    </Content>
  );
};

export default ReviewStep;
