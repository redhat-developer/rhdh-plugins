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
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Box from '@material-ui/core/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '@mui/material/styles';
import { Link } from '@backstage/core-components';
import { productData } from './productData';

interface SandboxCatalogCardProps {
  key: React.Key;
  title: string;
  image: string;
  description: {
    icon: React.ReactNode;
    value: string;
  }[];
  link: string;
}

const SandboxCatalogCard: React.FC<SandboxCatalogCardProps> = ({
  key,
  title,
  image,
  description,
  link,
}) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      key={key}
      sx={{ width: '100%', height: '100%', padding: theme.spacing(2) }}
    >
      <CardMedia sx={{ padding: theme.spacing(2) }}>
        <Stack
          direction="row"
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <img
            src={image}
            alt={title}
            style={{ width: '48px', height: '48px' }}
          />
          <Typography
            variant="h5"
            style={{ fontSize: '16px', fontWeight: 700 }}
          >
            {title}
          </Typography>
        </Stack>
      </CardMedia>
      <CardContent style={{ padding: '0 16px' }}>
        {description?.map(point => (
          <Typography
            key={point.value}
            color="textPrimary"
            style={{ fontSize: '14px', paddingBottom: '8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {point.icon} {point.value}
            </div>
          </Typography>
        ))}
      </CardContent>
      <CardActions style={{ justifyContent: 'flex-start' }}>
        <Link to={link} underline="none">
          <Button
            size="medium"
            color="primary"
            variant="outlined"
            endIcon={<OpenInNewIcon />}
            sx={{
              border: `1px solid ${theme.palette.primary.main}`,
              marginTop: theme.spacing(0.5),
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                borderColor: '#1976d2',
              },
            }}
          >
            Try it
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
};

export const SandboxCatalogGrid: React.FC = () => {
  return (
    <Grid container spacing={3} sx={{ maxWidth: '100%' }}>
      {productData?.map(product => (
        <Grid item xs={12} sm="auto" md="auto" key={product.id}>
          <Box sx={{ width: '330px', height: '416px' }}>
            <SandboxCatalogCard
              key={product.id}
              title={product.title}
              image={product.image}
              description={product.description}
              link={product.link}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};
