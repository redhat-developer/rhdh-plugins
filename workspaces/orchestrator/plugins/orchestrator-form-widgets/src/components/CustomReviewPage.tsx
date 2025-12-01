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
 * To use this custom review page:
 * 1. Import this component in FormWidgetsApi.tsx
 * 2. Return it from the getReviewComponent() method:
 *
 *    getReviewComponent() {
 *      return CustomReviewPage;
 *    }
 *
 * Or create your own custom review component following this pattern.
 *
 * See docs/extensibleForm.md for more details.
 */

import React, { useMemo } from 'react';
import { Content } from '@backstage/core-components';
import { ReviewComponentProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
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
  label: {
    fontWeight: 600,
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(1),
  },
  value: {
    color: theme.palette.text.primary,
  },
  row: {
    display: 'flex',
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
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
}));

const renderValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return (
      <Typography variant="body2" color="textSecondary">
        N/A
      </Typography>
    );
  }
  if (typeof value === 'object') {
    return (
      <Typography
        variant="body2"
        component="pre"
        sx={{ whiteSpace: 'pre-wrap' }}
      >
        {JSON.stringify(value, null, 2)}
      </Typography>
    );
  }
  return <Typography variant="body2">{String(value)}</Typography>;
};

/**
 * Custom review page component with enhanced styling
 * This demonstrates how to create a custom review page for the orchestrator form
 */
export const CustomReviewPage: React.FC<ReviewComponentProps> = ({
  data,
  schema: _schema,
  busy,
  handleExecute,
}) => {
  const { classes } = useStyles();

  const flattenedData = useMemo(() => {
    const result: Array<{ key: string; value: any; path: string }> = [];

    const flatten = (obj: any, prefix = '', displayPrefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = prefix ? `${prefix}.${key}` : key;
        const newDisplayPrefix = displayPrefix
          ? `${displayPrefix} > ${key}`
          : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, newPath, newDisplayPrefix);
        } else {
          result.push({ key: newDisplayPrefix, value, path: newPath });
        }
      });
    };

    flatten(data);
    return result;
  }, [data]);

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

        <Box sx={{ mt: 3 }}>
          {flattenedData.map(({ key, value }) => (
            <Box key={key} className={classes.row}>
              <Typography className={classes.label} sx={{ minWidth: '200px' }}>
                {key}:
              </Typography>
              <Box className={classes.value} sx={{ flex: 1 }}>
                {renderValue(value)}
              </Box>
            </Box>
          ))}
        </Box>

        <Box className={classes.footer}>
          <Button variant="outlined" disabled={busy}>
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExecute}
            disabled={busy}
          >
            {busy ? 'Executing...' : 'Run Workflow'}
          </Button>
        </Box>
      </Paper>
    </Content>
  );
};
