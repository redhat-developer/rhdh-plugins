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

import type { SetStateAction } from 'react';

import { useCallback, useEffect, useState } from 'react';

import { ErrorPage, Progress } from '@backstage/core-components';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';

import yaml from 'yaml';
import { useNavigate } from 'react-router-dom';

import {
  MarketplacePackage,
  ExtensionsPackageAppConfigExamples,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import {
  packageInstallRouteRef,
  pluginInstallRouteRef,
  pluginRouteRef,
} from '../routes';

import { CodeEditorContextProvider, useCodeEditor } from './CodeEditor';
import { usePackage } from '../hooks/usePackage';
import { CodeEditorCard } from './CodeEditorCard';
import { TabPanel } from './TabPanel';

interface TabItem {
  label: string;
  content: string | ExtensionsPackageAppConfigExamples[];
  key: string;
  others?: { [key: string]: any };
}

export const MarketplacePackageInstallContent = ({
  pkg,
}: {
  pkg: MarketplacePackage;
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

  const onLoaded = useCallback(() => {
    const dynamicPluginYaml = {
      plugins: [
        {
          package: pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....',
          disabled: false,
        },
      ],
    };
    codeEditor.setValue(yaml.stringify(dynamicPluginYaml));
  }, [codeEditor, pkg]);

  const navigate = useNavigate();
  const examples = [
    {
      [`${pkg.metadata.name}`]: pkg.spec?.appConfigExamples,
    },
  ];
  const packageDynamicArtifacts = {
    [`${pkg.metadata.name}`]: pkg.spec?.dynamicArtifact,
  };
  const availableTabs = [
    !!Object.values(examples[0])[0] && {
      label: 'Examples',
      content: examples,
      key: 'examples',
      others: { packageNames: packageDynamicArtifacts },
    },
  ].filter(tab => tab) as TabItem[];

  const showRightCard = examples;
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_: any, newValue: SetStateAction<number>) => {
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
        <CodeEditorCard onLoad={onLoaded} />

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
        <Button variant="contained" color="primary" disabled>
          Install
        </Button>
        <Button
          variant="outlined"
          color="primary"
          sx={{ ml: 2 }}
          onClick={() => navigate(pluginLink)}
        >
          Cancel
        </Button>
        <Button
          variant="text"
          color="primary"
          onClick={onLoaded}
          sx={{ ml: 3 }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
};

export const MarketplacePackageInstallContentLoader = () => {
  const params = useRouteRefParams(packageInstallRouteRef);

  const pkg = usePackage(params.namespace, params.name);

  if (pkg.isLoading) {
    return <Progress />;
  } else if (pkg.data) {
    return (
      <CodeEditorContextProvider>
        <MarketplacePackageInstallContent pkg={pkg.data} />
      </CodeEditorContextProvider>
    );
  } else if (pkg.error) {
    return <ErrorPage statusMessage={pkg.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={`Package ${params.namespace}/${params.name} not found!`}
    />
  );
};
