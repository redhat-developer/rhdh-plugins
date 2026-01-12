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

import React from 'react';

import { JsonObject, JsonValue } from '@backstage/types';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(theme => ({
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary,
  },
  row: {
    display: 'flex',
    padding: theme.spacing(1, 0),
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  label: {
    minWidth: '200px',
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  value: {
    flex: 1,
    color: theme.palette.text.primary,
    wordBreak: 'break-word',
  },
  nestedSection: {
    marginLeft: theme.spacing(2),
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    borderLeft: `3px solid ${theme.palette.divider}`,
  },
}));

interface NestedReviewTableProps {
  data: JsonObject;
}

const isObject = (value: any): value is JsonObject => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const renderValue = (value: JsonValue | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const RenderNestedData: React.FC<{ data: JsonObject; classes: any }> = ({
  data,
  classes,
}) => {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (isObject(value)) {
          // Render nested section with title
          return (
            <Box key={key} className={classes.nestedSection}>
              <Typography variant="subtitle2" className={classes.sectionTitle}>
                {key}
              </Typography>
              <RenderNestedData data={value} classes={classes} />
            </Box>
          );
        }

        // Render simple key-value pair
        return (
          <Box key={key} className={classes.row}>
            <Typography className={classes.label}>{key}:</Typography>
            <Typography className={classes.value}>
              {renderValue(value)}
            </Typography>
          </Box>
        );
      })}
    </>
  );
};

export const NestedReviewTable: React.FC<NestedReviewTableProps> = ({
  data,
}) => {
  const { classes } = useStyles();

  // Group top-level sections
  const sections: [string, JsonValue][] = Object.entries(data).filter(
    ([_, value]) => value !== undefined,
  ) as [string, JsonValue][];

  return (
    <Box>
      {sections.map(([sectionKey, sectionValue]) => {
        if (isObject(sectionValue)) {
          // Render as a section with title
          return (
            <Box key={sectionKey} className={classes.section}>
              <Typography variant="h6" className={classes.sectionTitle}>
                {sectionKey}
              </Typography>
              <Divider style={{ marginBottom: '12px' }} />
              <RenderNestedData data={sectionValue} classes={classes} />
            </Box>
          );
        }

        // Simple value at top level
        return (
          <Box key={sectionKey} className={classes.row}>
            <Typography className={classes.label}>{sectionKey}:</Typography>
            <Typography className={classes.value}>
              {renderValue(sectionValue)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default NestedReviewTable;
