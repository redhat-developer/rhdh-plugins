/*
 * Copyright 2024 The Backstage Authors
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
import Tabs, { TabsProps } from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

export const TabExamples = () => {
  const colors: TabsProps['indicatorColor'][] = [
    undefined,
    'primary',
    'secondary',
  ];

  const [selectedTab, setSelectedTab] = React.useState(0);
  const handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <div>
      {colors.map(color => (
        <div key={color}>
          <div style={{ padding: '20px 0' }}>color: {color ?? 'undefined'}</div>
          <Tabs
            value={selectedTab}
            indicatorColor="primary"
            textColor="primary"
            onChange={handleChange}
          >
            <Tab label="One" />
            <Tab label="Two" />
            <Tab label="Three" />
            <Tab label="Disabled" disabled />
          </Tabs>
        </div>
      ))}

      <div style={{ padding: '20px 0' }}>Vertical test</div>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ p: 2 }}>
          <Tabs
            orientation="vertical"
            value={selectedTab}
            indicatorColor="primary"
            textColor="primary"
            onChange={handleChange}
            aria-label="disabled tabs example"
          >
            <Tab label="One" />
            <Tab label="Two" />
            <Tab label="Extra long label Three" />
            <Tab label="Disabled" disabled />
          </Tabs>
        </Box>
        <Box
          sx={{ height: 200, width: '100%', border: '1px solid #ccc', m: 2 }}
        >
          <Typography variant="h6" style={{ padding: '20px' }}>{`selectedTab: ${
            selectedTab + 1
          }`}</Typography>
        </Box>
      </Box>
    </div>
  );
};
