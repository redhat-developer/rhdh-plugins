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
import { InfoCard } from '@backstage/core-components';
import {
  Grid,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  makeStyles,
} from '@material-ui/core';
import { Interval } from '../../../models/ChartEnums';

const useStyles = makeStyles(theme => ({
  value: {
    fontWeight: 'bold',
    overflow: 'hidden',
    lineHeight: '24px',
    wordBreak: 'break-word',
  },
  label: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
}));

interface ContainerInfoCardProps {
  containerData: Array<{ key: string; value?: string }>;
  onRecommendationTermChange: (
    event: React.ChangeEvent<{
      name?: string;
      value: unknown;
    }>,
    child: React.ReactNode,
  ) => void;
  recommendationTerm: Interval;
}

export const ContainerInfoCard = (props: ContainerInfoCardProps) => {
  const classes = useStyles();

  return (
    <InfoCard
      title="Details"
      action={
        <FormControl variant="outlined" style={{ top: '0.4rem' }}>
          <InputLabel id="term-label">Term</InputLabel>
          <Select
            labelId="term-label"
            id="term"
            value={props.recommendationTerm}
            onChange={props.onRecommendationTermChange}
            label="Term"
          >
            <MenuItem value="shortTerm">Last 24 hrs</MenuItem>
            <MenuItem value="mediumTerm">Last 7 days</MenuItem>
            <MenuItem value="longTerm">Last 15 days</MenuItem>
          </Select>
        </FormControl>
      }
    >
      <Grid container spacing={2}>
        {props.containerData.map(item => [
          <Grid item xs={2} key={item.key}>
            <Typography variant="h2" className={classes.label}>
              {item.key}
            </Typography>
            <Typography variant="body1" className={classes.value}>
              {item.value}
            </Typography>
          </Grid>,
        ])}
      </Grid>
    </InfoCard>
  );
};
ContainerInfoCard.displayName = 'ContainerInfoCard';
