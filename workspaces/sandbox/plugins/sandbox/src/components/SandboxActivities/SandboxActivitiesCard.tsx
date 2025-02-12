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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import { makeStyles } from '@material-ui/core';
import FeaturedArticleBanner from '../../assets/images/featured-article.png';

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: '326px',
    minHeight: '368px',
    borderRadius: 2,
    backgroundColor: theme.palette.background.default,
  },
}));

export const SandboxActivitiesCard = ({ index }: { index: number }) => {
  const classes = useStyles();
  return (
    <Card className={classes.card} key={index} elevation={0}>
      <CardMedia
        component="img"
        height="120"
        width="326"
        image={FeaturedArticleBanner}
        alt="Developer working on application"
      />
      <CardContent style={{ margin: '4px' }}>
        <Typography
          variant="h5"
          color="primary"
          style={{ fontWeight: 600 }}
          gutterBottom
        >
          Deploy an application on Developer Sandbox
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ fontStyle: 'italic' }}
        >
          Enables developers to easily test and refine their applications in a
          safe, isolated environment before launching them to production. This
          streamlined process reduces deployment risks and accelerates the
          development cycle, allowing for quicker iterations and improvements.
        </Typography>
      </CardContent>
    </Card>
  );
};
