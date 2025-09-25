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

import type { JsonObject } from '@backstage/types';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Grid from '@mui/material/Grid';

import { SubmitButton } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react';

import { useTranslation } from '../../hooks/useTranslation';

const MissingSchemaNotice = ({
  isExecuting,
  handleExecute,
}: {
  isExecuting: boolean;
  handleExecute: (parameters: JsonObject) => Promise<void>;
}) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Alert severity="info" style={{ width: '100%' }}>
          <AlertTitle>{t('messages.missingJsonSchema.title')}</AlertTitle>
          {t('messages.missingJsonSchema.message')}
          <br />
          To enable a form-based input, please provide a valid JSON schema in
          the <code>dataInputSchema</code> property of your workflow definition
          file.
        </Alert>
      </Grid>
      <Grid item xs={12}>
        <SubmitButton
          submitting={isExecuting}
          handleClick={() => handleExecute({})}
        >
          Run
        </SubmitButton>
      </Grid>
    </Grid>
  );
};

export default MissingSchemaNotice;
