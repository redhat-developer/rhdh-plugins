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
import { useTheme } from '@mui/material/styles';
import { Link } from '@backstage/core-components';
import {
  getEddlDataAttributes,
  useTrackAnalytics,
} from '../../utils/eddl-utils';

type SandboxActivitiesCardProps = {
  article: {
    img: string;
    title: string;
    description: string;
    link: string;
  };
};

export const SandboxActivitiesCard: React.FC<SandboxActivitiesCardProps> = ({
  article: { img, title, description, link },
}) => {
  const theme = useTheme();
  const trackAnalytics = useTrackAnalytics();
  const eddlAttributes = getEddlDataAttributes(title, 'Activities');

  // Handle activity click for analytics tracking
  const handleActivityClick = async () => {
    await trackAnalytics(title, 'Activities', link);
  };

  return (
    <Link
      to={link}
      onClick={handleActivityClick}
      style={{ textDecoration: 'none' }}
      {...eddlAttributes}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: '326px',
          minHeight: '368px',
          borderRadius: 2,
          border: `1px solid ${
            theme.palette.mode === 'dark' ? '#57585a' : '#E4E4E4'
          }`,
        }}
      >
        <CardMedia
          component="img"
          height="120"
          width="326"
          image={img}
          alt={title}
        />
        <CardContent sx={{ margin: theme.spacing(0.5), borderRadius: 2 }}>
          <Typography
            variant="h5"
            color="primary"
            sx={{ fontWeight: 600 }}
            gutterBottom
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ fontStyle: 'italic' }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
};
