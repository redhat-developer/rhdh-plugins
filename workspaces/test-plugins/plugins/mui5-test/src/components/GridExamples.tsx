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

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid, { GridProps } from '@mui/material/Grid';

const GridContainer = (props: GridProps) => <Grid container {...props} />;

const GridItem = (props: GridProps) => (
  <Grid
    item
    xs={12} // show 1 item  per row on extra small screens
    sm={6} // show 2 items per row on small screens
    md={4} // show 3 items per row on medium screens
    lg={3} // show 4 items per row on large screens
    xl={2} // show 6 items per row on extra large screens
    {...props}
  />
);

export const CommonGridExamples = () => {
  const cards = Array.from({ length: 8 }, (_, i) => i + 1);
  return (
    <>
      <h1>
        Default: Grid container without spacing, an unstyled Grid item and an
        unstyled Card
      </h1>
      <GridContainer>
        {cards.map(cardContent => (
          <GridItem key={cardContent}>
            <Card>{cardContent}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=2, an unstyled Grid item and an unstyled
        Card
      </h1>
      <GridContainer spacing={2}>
        {cards.map(cardContent => (
          <GridItem key={cardContent}>
            <Card>{cardContent}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=4, an unstyled Grid item and a Card with
        padding=2
      </h1>
      <GridContainer spacing={4}>
        {cards.map(cardContent => (
          <GridItem key={cardContent}>
            <Card sx={{ p: 2 }}>{cardContent}</Card>
          </GridItem>
        ))}
      </GridContainer>
    </>
  );
};

const DebugGridExamples = () => {
  const backgroundColors = [
    '#600',
    '#060',
    '#800',
    '#080',
    '#a00',
    '#0a0',
    '#d00',
    '#0d0',
  ];
  return (
    <>
      <h1>
        Grid container without spacing, an unstyled Grid item and colorized Card
      </h1>
      <GridContainer>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem key={backgroundColor}>
            <Card sx={{ color: '#ffffff', backgroundColor }}>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with colorized Grid item to show one-sided padding, Card
        position is fine
      </h1>
      <GridContainer>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            sx={{ color: '#ffffff', backgroundColor }}
          >
            <Card>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=4, an unstyled Grid item and a colorized
        Card with p=2
      </h1>
      <GridContainer spacing={4}>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem key={backgroundColor}>
            <Card sx={{ color: '#ffffff', backgroundColor, p: 2 }}>
              {index + 1}
            </Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=4, an colorized Grid item to show one-sided
        padding, Card position is fine
      </h1>
      <GridContainer spacing={4}>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            sx={{ color: '#ffffff', backgroundColor }}
          >
            <Card sx={{ p: 2 }}>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container without spacing and Grid item with p=4 result in
        unaligned Cards! (Too much padding on the right side!)
      </h1>
      <GridContainer>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            sx={{ color: '#ffffff', backgroundColor, p: 4 }}
          >
            <Card>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=4 and Grid item with p=4 result also in
        unaligned Cards! (Too much padding on the right side!)
      </h1>
      <GridContainer spacing={4}>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            sx={{ color: '#ffffff', backgroundColor, p: 4 }}
          >
            <Card>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>
    </>
  );
};

export const GridExamples = () => {
  const [showDebugExamples, setShowDebugExamples] = useState(false);
  return (
    <>
      <CommonGridExamples />
      <Box sx={{ pt: 4, pb: 4 }}>
        <FormControlLabel
          control={
            <Checkbox
              onChange={(_, checked) => setShowDebugExamples(checked)}
            />
          }
          label="Show debug examples"
        />
      </Box>
      {showDebugExamples && <DebugGridExamples />}
    </>
  );
};
