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

/**
 * EXAMPLE: Custom Review Page Component
 *
 * This is a reference implementation showing how to create a custom review page.
 * It is NOT actively used by default - the default review page is used instead.
 *
 * It follows the same data rules as the built-in `ReviewStep`: `generateReviewTableData`
 * for display (including `ui:hidden` handling) and the optional hidden-fields toggle.
 *
 * To use this custom review page:
 * 1. Import this component in FormWidgetsApi.tsx
 * 2. Return it from the getReviewComponent() method:
 *
 *    getReviewComponent() {
 *      return CustomReviewPage;
 *    }
 *
 * Or create your own custom component following this pattern.
 *
 * See docs/extensibleForm.md for more details.
 */

import React, { useMemo, useState } from 'react';
import { Content } from '@backstage/core-components';
import { JsonObject } from '@backstage/types';
import { ReviewComponentProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import {
  generateReviewTableData,
  NestedReviewTable,
  schemaHasUiHiddenFields,
  useTranslation,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(theme => ({
  paper: {
    padding: theme.spacing(3),
  },
  header: {
    marginBottom: theme.spacing(3),
    paddingBottom: theme.spacing(2),
    borderBottom: `2px solid ${theme.palette.primary.main}`,
  },
  section: {
    marginBottom: theme.spacing(2),
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(2),
    marginTop: theme.spacing(4),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  customBadge: {
    marginLeft: theme.spacing(1),
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
 * Custom review page component with enhanced styling.
 * Uses the same review data pipeline as the default `ReviewStep` for predictable behavior.
 */
export const CustomReviewPage: React.FC<ReviewComponentProps> = ({
  data,
  schema,
  busy,
  handleBack,
  handleExecute,
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles();
  const [showHiddenFields, setShowHiddenFields] = useState(false);

  const displayData = useMemo<JsonObject>(() => {
    return generateReviewTableData(schema, data, {
      includeHiddenFields: showHiddenFields,
    });
  }, [schema, data, showHiddenFields]);

  const showHiddenFieldsNote = useMemo(
    () => schemaHasUiHiddenFields(schema),
    [schema],
  );

  return (
    <Content noPadding>
      <Paper elevation={0} className={classes.paper}>
        <Box className={classes.header}>
          <Typography variant="h5" component="h2">
            🎨 Custom Review Page
            <Chip
              label="CUSTOM"
              color="primary"
              size="small"
              className={classes.customBadge}
            />
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This is a custom review page component provided via the
            OrchestratorFormApi plugin system
          </Typography>
        </Box>

        <Box className={classes.section}>
          <Typography variant="h6" gutterBottom>
            Review Your Information
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Please review the information below before submitting the workflow
          </Typography>
        </Box>

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

        <Box sx={{ mt: 3 }}>
          <NestedReviewTable data={displayData} />
        </Box>

        <Box className={classes.footer}>
          <Button variant="outlined" onClick={handleBack} disabled={busy}>
            {t('common.back')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExecute}
            disabled={busy}
          >
            {busy ? 'Executing...' : t('common.run')}
          </Button>
        </Box>
      </Paper>
    </Content>
  );
};
