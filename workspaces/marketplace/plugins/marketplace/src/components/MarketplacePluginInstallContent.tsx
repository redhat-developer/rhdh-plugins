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

import React, { useEffect, useState } from 'react';

import { ErrorPage, Progress } from '@backstage/core-components';
import {
  alertApiRef,
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';

import yaml from 'yaml';
import { useNavigate } from 'react-router-dom';

import {
  MarketplacePackage,
  MarketplacePackageSpecAppConfigExample,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { JsonObject } from '@backstage/types';

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
import Tooltip from '@mui/material/Tooltip';

import { pluginInstallRouteRef, pluginRouteRef } from '../routes';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginPackages } from '../hooks/usePluginPackages';
import { applyContent, getExampleAsMarkdown } from '../utils';

import {
  CodeEditorContextProvider,
  CodeEditor,
  useCodeEditor,
} from './CodeEditor';
import { Markdown } from './Markdown';
import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';

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

interface TabItem {
  label: string;
  content: string | MarketplacePackageSpecAppConfigExample[];
  key: string;
  others?: { [key: string]: any };
}

interface TabPanelProps {
  markdownContent: string | MarketplacePackageSpecAppConfigExample[];
  index: number;
  value: number;
  others?: { [key: string]: any };
}

const TabPanel = ({ markdownContent, index, value, others }: TabPanelProps) => {
  const alertApi = useApi(alertApiRef);
  const codeEditor = useCodeEditor();
  if (value !== index) return null;

  const handleApplyContent = (content: string | JsonObject) => {
    try {
      const codeEditorContent = codeEditor.getValue();
      const newContent = applyContent(
        codeEditorContent || '',
        others?.packageName,
        content,
      );
      const selection = codeEditor.getSelection();
      const position = codeEditor.getPosition();
      if (newContent) {
        codeEditor.setValue(newContent);
        if (selection) {
          codeEditor.setSelection(selection);
        }
        if (position) {
          codeEditor.setPosition(position);
        }
      }
    } catch (error) {
      alertApi.post({
        display: 'transient',
        severity: 'warning',
        message: `Could not apply YAML: ${error}`,
      });
    }
  };

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
                {item.content !== 'string' && (
                  <Button
                    sx={{ float: 'right' }}
                    onClick={() => handleApplyContent(item.content)}
                  >
                    Apply
                  </Button>
                )}
              </Typography>
              <Markdown content={getExampleAsMarkdown(item.content)} />
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
  const [hasGlobalHeader, setHasGlobalHeader] = useState(false);

  useEffect(() => {
    const header = document.querySelector('nav#global-header');
    setHasGlobalHeader(Boolean(header));
  }, []);

  const dynamicHeight = hasGlobalHeader
    ? 'calc(100vh - 220px)'
    : 'calc(100vh - 160px)';

  const codeEditor = useCodeEditor();
  const params = useRouteRefParams(pluginInstallRouteRef);

  const pluginLink = useRouteRef(pluginRouteRef)({
    namespace: params.namespace,
    name: params.name,
  });

  const onLoaded = React.useCallback(() => {
    const dynamicPluginYaml = {
      plugins: (packages ?? []).map(pkg => ({
        package: pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....',
        disabled: false,
      })),
    };
    codeEditor.setValue(yaml.stringify(dynamicPluginYaml));
  }, [codeEditor, packages]);

  const navigate = useNavigate();
  const pluginConfigPermissions = usePluginConfigurationPermissions(
    params.namespace,
    params.name,
  );
  const examples = packages[0]?.spec?.appConfigExamples;
  const installationInstructions = plugin.spec?.installation;
  const aboutMarkdown = plugin.spec?.description;
  const availableTabs = [
    examples && {
      label: 'Examples',
      content: examples,
      key: 'examples',
      others: { packageName: packages[0].spec?.dynamicArtifact },
    },
    installationInstructions && {
      label: 'Setting up the plugin',
      content: installationInstructions,
      key: 'installation',
    },
    aboutMarkdown && {
      label: 'About the plugin',
      content: aboutMarkdown,
      key: 'about',
    },
  ].filter(tab => tab) as TabItem[];

  const showRightCard = examples || installationInstructions || aboutMarkdown;
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_: any, newValue: React.SetStateAction<number>) => {
    setTabIndex(newValue);
  };

  return (
    <Box
      sx={{
        height: dynamicHeight,
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
        {packages.length > 0 && (
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
        )}

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
                    {availableTabs.map((tab, index) => (
                      <Tab
                        key={tab.key}
                        value={index}
                        label={tab.label ?? ''}
                      />
                    ))}
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
                  {availableTabs.map(
                    (tab, index) =>
                      tabIndex === index && (
                        <TabPanel
                          key={tab.key}
                          value={tabIndex}
                          index={index}
                          markdownContent={tab.content ?? ''}
                          others={tab.others}
                        />
                      ),
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Box
        sx={{
          mt: 4,
          flexShrink: 0,
          backgroundColor: 'inherit',
        }}
      >
        <Box sx={{ mt: 1, mb: 2, display: 'none' }}>
          <CheckboxList packages={packages} />
        </Box>
        <Tooltip
          title={
            pluginConfigPermissions.data?.write !== 'ALLOW'
              ? "You don't have permission to install plugins or edit their configurations. Contact your administrator to request access or assistance."
              : ''
          }
        >
          <Typography component="span">
            <Button variant="contained" color="primary" disabled>
              Install
            </Button>
          </Typography>
        </Tooltip>
        <Button
          variant="outlined"
          color="primary"
          sx={{ ml: 2 }}
          onClick={() => navigate(pluginLink)}
        >
          Cancel
        </Button>
        {(pluginConfigPermissions.data?.write === 'ALLOW' ||
          pluginConfigPermissions.data?.read === 'ALLOW') && (
          <Button
            variant="text"
            color="primary"
            onClick={onLoaded}
            sx={{ ml: 3 }}
          >
            Reset
          </Button>
        )}
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
