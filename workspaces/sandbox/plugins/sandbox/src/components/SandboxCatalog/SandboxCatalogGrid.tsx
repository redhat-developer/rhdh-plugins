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
import {
  Card,
  CardContent,
  Typography,
  Button,
  makeStyles,
  Theme,
  CardActions,
  CardMedia,
  Link,
} from '@material-ui/core';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ItemCardGrid } from '@backstage/core-components';
import { productData } from './productData';

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    maxWidth: '330px',
    minHeight: '330px',
    padding: theme.spacing(2),
  },
  title: {
    padding: theme.spacing(2),
  },
  image: {
    maxWidth: '207px',
    height: 'auto',
  },
}));

interface SandboxCatalogCardProps {
  key: React.Key;
  title: string;
  image: {
    icon: string;
    maxWidth: string;
  };
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
  const classes = useStyles();
  return (
    <Card className={classes.card} elevation={0} key={key}>
      <CardMedia className={classes.title}>
        <img
          src={image.icon}
          alt={title}
          style={{ maxWidth: image.maxWidth, height: 'auto' }}
        />
      </CardMedia>
      <CardContent style={{ padding: '0 16px' }}>
        {description.map((point, index) => (
          <Typography
            key={index}
            color="textPrimary"
            style={{ fontSize: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {point.icon} {point.value}
            </div>
          </Typography>
        ))}
      </CardContent>
      <CardActions style={{ justifyContent: 'flex-start' }}>
        <Link href={link} target="_blank" underline="none">
          <Button
            size="medium"
            color="primary"
            variant="outlined"
            endIcon={<OpenInNewIcon />}
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
    <ItemCardGrid>
      {productData?.map((product, index) => (
        <SandboxCatalogCard
          key={index}
          title={product.title}
          image={product.image}
          description={product.description}
          link={product.link}
        />
      ))}
    </ItemCardGrid>
  );
};
