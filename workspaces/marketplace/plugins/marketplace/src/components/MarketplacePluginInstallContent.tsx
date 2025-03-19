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
  MarketplacePackageSpecAppConfigExample,
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
import { useNavigate } from 'react-router-dom';
import { Markdown } from './Markdown';

const copyIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#6a6e73">
    <g><rect fill="none" height="24" width="24"/></g>
    <g>
      <path d="M15,20H5V7c0-0.55-0.45-1-1-1h0C3.45,6,3,6.45,3,7v13c0,1.1,0.9,2,2,2h10c0.55,0,1-0.45,1-1v0C16,20.45,15.55,20,15,20z M20,16V4c0-1.1-0.9-2-2-2H9C7.9,2,7,2.9,7,4v12c0,1.1,0.9,2,2,2h9C19.1,18,20,17.1,20,16z M18,16H9V4h9V16z"/>
    </g>
  </svg>
`;

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
  markdownContent: string | MarketplacePackageSpecAppConfigExample[];
  index: number;
  value: number;
}

interface TabPanelProps {
  markdownContent: string | MarketplacePackageSpecAppConfigExample[];
  index: number;
  value: number;
}

const TabPanel = ({ markdownContent, index, value }: TabPanelProps) => {
  if (value !== index) return null;

  return (
    <Box
      role="tabpanel"
      sx={{ flex: 1, overflow: 'auto', p: 2, scrollbarWidth: 'thin' }}
    >
      <Typography component="div">
        {Array.isArray(markdownContent) ? (
          markdownContent.map((item, idx) => (
            <Box key={idx} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {item.title}
              </Typography>
              <Markdown
                content={
                  typeof item.content === 'string'
                    ? item.content
                    : JSON.stringify(item.content, null, 2)
                }
              />
            </Box>
          ))
        ) : (
          <Markdown content={markdownContent} />
        )}
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
  const installationInstructions = plugin.spec?.installation;
  const examples = packages[0]?.spec?.appConfigExamples;
  const showRightCard = installationInstructions || examples;
  const [tabIndex, setTabIndex] = useState(0);

  React.useEffect(() => {
    document.querySelectorAll('pre code').forEach(codeBlock => {
      const pre = codeBlock.parentElement;

      if (!pre) return;
      if (pre.querySelector('.copy-button')) return;

      const button = document.createElement('button');
      button.className = 'copy-button';
      Object.assign(button.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '2px',
        color: '#6a6e73',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
      });

      button.innerHTML = copyIconSvg;

      button.addEventListener('click', () => {
        window.navigator.clipboard
          .writeText((codeBlock as HTMLElement).innerText)
          .then(() => {
            button.innerText = '✔';
            setTimeout(() => {
              button.innerHTML = copyIconSvg;
            }, 2000);
          });
      });

      pre.style.position = 'relative';
      pre.appendChild(button);
    });
  }, [installationInstructions]);

  const handleTabChange = (_: any, newValue: React.SetStateAction<number>) => {
    setTabIndex(newValue);
  };

  return (
    <Box
      sx={{
        height: 'calc(100vh - 160px)',
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
                width: '99.8%', // workaround for 'overflow: hidden' causing card to be missing a border
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
                    href="/path-to-file.zip" // update this
                    download
                    sx={{
                      fontSize: 16,
                      display: 'none', // change to 'flex' when ready
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
                    <TabPanel
                      value={tabIndex}
                      index={0}
                      markdownContent={installationInstructions ?? ''}
                    />
                  )}

                  {tabIndex === 1 && (
                    <TabPanel
                      value={tabIndex}
                      index={1}
                      markdownContent={examples ?? ''}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Box
        sx={{
          flexShrink: 0,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ mt: 1, mb: 2 }}>
          <CheckboxList packages={packages} />
        </Box>
        <Button variant="contained" color="primary" disabled>
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
          onClick={() => navigate('/extensions/plugins')}
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
