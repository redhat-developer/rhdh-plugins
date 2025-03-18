/*
 * Copyright The Backstage Authors
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

import React, { useState } from 'react';

import { ErrorPage, Progress } from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';

import yaml from 'yaml';
import { useCopyToClipboard } from 'react-use';

import {
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { pluginInstallRouteRef } from '../routes';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginPackages } from '../hooks/usePluginPackages';
import {
  CodeEditorContextProvider,
  CodeEditor,
  useCodeEditor,
} from './CodeEditor';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const generateCheckboxList = (packages: MarketplacePackage[]) => {
  const hasFrontend = packages.some(
    pkg => pkg.spec?.backstage?.role === 'frontend-plugin',
  );
  const hasBackend = packages.some(
    pkg => pkg.spec?.backstage?.role === 'backend-plugin',
  );

  const checkboxes = [
    { label: 'Install front-end plugin', show: hasFrontend },
    { label: 'Install back-end plugin', show: hasBackend },
    { label: 'Install software templates', show: true }, // TODO, now always show
  ];

  return checkboxes.filter(cb => cb.show);
};

const CheckboxList = ({ packages }: { packages: MarketplacePackage[] }) => {
  const checkboxes = generateCheckboxList(packages);
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});

  const handleChange = (label: string) => {
    setChecked(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <FormGroup>
      {checkboxes.map((cb, index) => (
        <FormControlLabel
          key={index}
          control={
            <Checkbox
              checked={checked[cb.label] ?? false}
              onChange={() => handleChange(cb.label)}
            />
          }
          label={cb.label}
        />
      ))}
    </FormGroup>
  );
};

interface TabPanelProps {
  children: string;
  index: number;
  value: number;
}

const TabPanel = ({ children, index, value }: TabPanelProps) => {
  if (value !== index) return null;

  return (
    <Box
      role="tabpanel"
      sx={{ flex: 1, overflow: 'auto', p: 2, scrollbarWidth: 'thin' }}
    >
      <Typography component="div">
        <ReactMarkdown>{children}</ReactMarkdown>
      </Typography>
    </Box>
  );
};

export const MarketplacePluginInstallContent = ({
  plugin,
  packages,
}: {
  plugin: MarketplacePlugin;
  packages: MarketplacePackage[];
}) => {
  const codeEditor = useCodeEditor();

  const onLoaded = React.useCallback(() => {
    const dynamicPluginYaml = {
      plugins: (packages ?? []).map(pkg => ({
        package: pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....',
        disabled: false,
      })),
    };
    codeEditor.setValue(yaml.stringify(dynamicPluginYaml));
  }, [codeEditor, packages]);

  // Just a demo
  const showFullPlugin = React.useCallback(() => {
    codeEditor.setValue(yaml.stringify(plugin));
  }, [codeEditor, plugin]);

  const [, copyToClipboard] = useCopyToClipboard();
  const handleCopyToClipboard = React.useCallback(() => {
    const value = codeEditor.getValue();
    if (value) {
      copyToClipboard(value);
    }
  }, [codeEditor, copyToClipboard]);

  const navigate = useNavigate();
  const theme = useTheme();
  const borderColor = theme.palette.mode === 'dark' ? '#a3a3a3' : '#c7c7c7';
  const installationInstructions = plugin.spec?.installation;
  const examples = packages[0]?.spec?.appConfigExamples;
  const showRightCard = installationInstructions || examples;
  // const [yamlText, setYamlText] = useState('');
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_: any, newValue: React.SetStateAction<number>) => {
    setTabIndex(newValue);
  };

  return (
    <Box
      sx={{
        height: '80vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Grid
        container
        spacing={3}
        sx={{ flex: 1, overflow: 'hidden', height: '100%', pb: 1 }}
      >
        <Grid
          item
          xs={12}
          md={6.5}
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <Card
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 0,
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                scrollbarWidth: 'thin',
              }}
            >
              <CodeEditor defaultLanguage="yaml" onLoaded={onLoaded} />
            </CardContent>
          </Card>
        </Grid>

        {showRightCard && (
          <Grid
            item
            xs={12}
            md={5.5}
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Card
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                borderRight: `1px solid ${borderColor}`,
              }}
            >
              <CardHeader
                title={
                  <Typography variant="h3">
                    Installation instructions
                  </Typography>
                }
                action={
                  <Typography
                    component="a"
                    href="/path-to-file.zip" // TOTO
                    download
                    sx={{
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'primary.main',
                      textDecoration: 'none',
                      m: 1,
                    }}
                  >
                    <FileDownloadOutlinedIcon fontSize="small" />
                    Download
                  </Typography>
                }
                sx={{ pb: 0 }}
              />
              <CardContent
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    aria-label="Plugin tabs"
                  >
                    {installationInstructions && (
                      <Tab
                        label={`Setting up the ${plugin.metadata.name} plugin`}
                      />
                    )}
                    {examples && <Tab label="Examples" />}
                  </Tabs>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {tabIndex === 0 && (
                    <TabPanel value={tabIndex} index={0}>
                      {plugin.spec?.installation ??
                        'No installation instructions provided'}
                    </TabPanel>
                  )}

                  {tabIndex === 1 && (
                    <TabPanel value={tabIndex} index={1}>
                      test
                    </TabPanel>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      <Box sx={{ flexShrink: 0, mt: 1, mb: 6 }}>
        <CheckboxList packages={packages} />
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          backgroundColor: 'background.paper',
        }}
      >
        <Button variant="contained" color="primary">
          Install
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onLoaded}
          sx={{ ml: 2 }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={showFullPlugin}
          sx={{ mx: 2 }}
        >
          Show full plugin
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCopyToClipboard}
        >
          Copy
        </Button>
        <Button
          variant="outlined"
          color="primary"
          sx={{ ml: 2 }}
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export const MarketplacePluginInstallContentLoader = () => {
  const params = useRouteRefParams(pluginInstallRouteRef);

  const plugin = usePlugin(params.namespace, params.name);
  const packages = usePluginPackages(params.namespace, params.name);

  if (plugin.isLoading || packages.isLoading) {
    return <Progress />;
  } else if (plugin.data && packages.data) {
    return (
      <CodeEditorContextProvider>
        <MarketplacePluginInstallContent
          plugin={plugin.data}
          packages={packages.data}
        />
      </CodeEditorContextProvider>
    );
  } else if (plugin.error) {
    return <ErrorPage statusMessage={plugin.error.toString()} />;
  } else if (packages.error) {
    return <ErrorPage statusMessage={packages.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={`Plugin ${params.namespace}/${params.name} not found!`}
    />
  );
};
