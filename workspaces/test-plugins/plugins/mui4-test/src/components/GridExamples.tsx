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
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid, { GridProps } from '@material-ui/core/Grid';

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
            <Card style={{ padding: 16 }}>{cardContent}</Card>
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
            <Card style={{ color: '#ffffff', backgroundColor }}>
              {index + 1}
            </Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with colorized Grid item to show all-sided padding, Card
        position is fine
      </h1>
      <GridContainer>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            style={{ color: '#ffffff', backgroundColor }}
          >
            <Card>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=4, an unstyled Grid item and a colorized
        Card with padding=16
      </h1>
      <GridContainer spacing={4}>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem key={backgroundColor}>
            <Card style={{ color: '#ffffff', backgroundColor, padding: 16 }}>
              {index + 1}
            </Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=4, an colorized Grid item to show all-sided
        padding, Card position is fine
      </h1>
      <GridContainer spacing={4}>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            style={{ color: '#ffffff', backgroundColor }}
          >
            <Card style={{ padding: 16 }}>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container without spacing and Grid item with padding=32 result in
        aligned Cards! (Not in MUI v5!)
      </h1>
      <GridContainer>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            style={{ color: '#ffffff', backgroundColor, padding: 32 }}
          >
            <Card>{index + 1}</Card>
          </GridItem>
        ))}
      </GridContainer>

      <h1>
        Grid container with spacing=4 and Grid item with padding=32 result also
        in aligned Cards! (Not in MUI v5!)
      </h1>
      <GridContainer spacing={4}>
        {backgroundColors.map((backgroundColor, index) => (
          <GridItem
            key={backgroundColor}
            style={{ color: '#ffffff', backgroundColor, padding: 32 }}
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
