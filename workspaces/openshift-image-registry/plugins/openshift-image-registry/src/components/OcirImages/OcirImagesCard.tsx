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

import {
  ItemCardHeader,
  LinkButton,
  MarkdownContent,
} from '@backstage/core-components';

import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';

import { ImageStreamMetadata } from '../../types';

const useStyles = makeStyles<Theme>(theme => ({
  label: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    lineHeight: 1,
    paddingBottom: '0.2rem',
  },
  description: {
    '& p': {
      margin: '0px',
    },
  },
}));

type OcirImagesCardProps = {
  imageStream: ImageStreamMetadata;
  onImageStreamSelected: (imageStream: ImageStreamMetadata) => void;
};

export const OcirImagesCard = ({
  imageStream,
  onImageStreamSelected,
}: OcirImagesCardProps) => {
  const classes = useStyles();

  return (
    <Card>
      <CardMedia>
        <ItemCardHeader title={imageStream.name} />
      </CardMedia>
      <CardContent
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Box>
          <Typography variant="body2" className={classes.label}>
            Description
          </Typography>
          <MarkdownContent
            content={imageStream.description ?? 'N/A'}
            className={classes.description}
          />
        </Box>
        <Box>
          <Typography variant="body2" className={classes.label}>
            Last Modified
          </Typography>
          <Typography className={classes.description}>
            {imageStream.last_modified || 'N/A'}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="body2"
            className={classes.label}
            style={{ marginBottom: '4px' }}
          >
            Tags
          </Typography>
          {imageStream.tags?.length
            ? imageStream.tags.map((tag: string) => (
                <Chip key={tag} size="small" label={tag} />
              ))
            : 'N/A'}
        </Box>
      </CardContent>
      <CardActions>
        <LinkButton
          color="primary"
          to=""
          onClick={() => onImageStreamSelected(imageStream)}
        >
          Open
        </LinkButton>
      </CardActions>
    </Card>
  );
};
