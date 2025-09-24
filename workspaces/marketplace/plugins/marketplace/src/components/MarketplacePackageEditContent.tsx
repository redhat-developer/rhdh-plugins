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
import { useRouteRefParams } from '@backstage/core-plugin-api';

import { useLocation, useNavigate } from 'react-router-dom';

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
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { packageInstallRouteRef } from '../routes';

import { CodeEditorContextProvider, useCodeEditor } from './CodeEditor';
import { useInstallPackage } from '../hooks/useInstallPackage';
import { usePackage } from '../hooks/usePackage';
import { CodeEditorCard } from './CodeEditorCard';
import { TabPanel } from './TabPanel';

interface TabItem {
  label: string;
  content: string | ExtensionsPackageAppConfigExamples[];
  key: string;
  others?: { [key: string]: any };
}

export const MarketplacePackageEditContent = ({
  pkg,
}: {
  pkg: MarketplacePackage;
}) => {
  const { mutateAsync: installPackage } = useInstallPackage();
  const [hasGlobalHeader, setHasGlobalHeader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const header = document.querySelector('nav#global-header');
    setHasGlobalHeader(Boolean(header));
  }, []);

  const dynamicHeight = hasGlobalHeader
    ? 'calc(100vh - 220px)'
    : 'calc(100vh - 160px)';

  const codeEditor = useCodeEditor();
  const params = useRouteRefParams(packageInstallRouteRef);

  const onLoaded = useCallback(() => {
    const path = pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....';
    const yamlContent = `plugins:\n  - package: ${JSON.stringify(path)}\n    disabled: false\n`;
    codeEditor.setValue(yamlContent);
  }, [codeEditor, pkg]);

  const navigate = useNavigate();
  const location = useLocation();
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

  const handleSave = async () => {
    try {
      setSaveError(null);
      setIsSubmitting(true);
      const raw = codeEditor.getValue() ?? '';
      const lines = raw.split('\n');
      const idx = lines.findIndex(l => /^\s*plugins\s*:/i.test(l));
      if (idx === -1) {
        setIsSubmitting(false);
        return;
      }
      const bodyLines = lines.slice(idx + 1);
      // Detect common indentation among non-empty lines
      const nonEmpty = bodyLines.filter(l => l.trim().length > 0);
      const commonIndent = nonEmpty.reduce(
        (acc, l) => {
          const m = l.match(/^(\s*)/);
          const indent = m ? m[1].length : 0;
          return acc === null ? indent : Math.min(acc, indent);
        },
        null as number | null,
      );
      const pluginsYamlString =
        (commonIndent ?? 0) > 0
          ? bodyLines
              .map(l =>
                l.startsWith(' '.repeat(commonIndent!))
                  ? l.slice(commonIndent!)
                  : l,
              )
              .join('\n')
          : bodyLines.join('\n');

      const linesNoIndent = pluginsYamlString.split('\n');
      let packageYamlString: string;
      if (linesNoIndent[0]?.startsWith('- ')) {
        linesNoIndent[0] = linesNoIndent[0].slice(2);
        for (let i = 1; i < linesNoIndent.length; i += 1) {
          if (linesNoIndent[i].startsWith('  ')) {
            linesNoIndent[i] = linesNoIndent[i].slice(2);
          }
        }
        packageYamlString = linesNoIndent.join('\n');
      } else {
        packageYamlString = pluginsYamlString;
      }

      const res = await installPackage({
        namespace: pkg.metadata.namespace ?? params.namespace,
        name: pkg.metadata.name,
        configYaml: packageYamlString.trim(),
      });

      if ((res as any)?.status === 'OK') {
        const ns = pkg.metadata.namespace ?? params.namespace;
        const name = pkg.metadata.name;
        const preserved = new URLSearchParams(location.search);
        preserved.set('package', `${ns}/${name}`);
        navigate(`/extensions/installed-packages?${preserved.toString()}`);
      } else {
        setSaveError((res as any)?.error?.message ?? 'Failed to save');
        setIsSubmitting(false);
      }
    } catch (e: any) {
      setSaveError(e?.error?.message ?? 'Failed to save');
      setIsSubmitting(false);
    }
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
                title={<Typography variant="h3">Edit instructions</Typography>}
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

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <Box
        sx={{
          mt: 4,
          flexShrink: 0,
          backgroundColor: 'inherit',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size="20px" color="inherit" />
            ) : undefined
          }
        >
          Save
        </Button>
        <Button
          variant="outlined"
          color="primary"
          sx={{ ml: 2 }}
          onClick={() => {
            const ns = pkg.metadata.namespace ?? params.namespace;
            const name = pkg.metadata.name;
            const preserved = new URLSearchParams(location.search);
            preserved.set('package', `${ns}/${name}`);
            navigate(`/extensions/installed-packages?${preserved.toString()}`);
          }}
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

export const MarketplacePackageEditContentLoader = () => {
  const params = useRouteRefParams(packageInstallRouteRef);

  const pkg = usePackage(params.namespace, params.name);

  if (pkg.isLoading) {
    return <Progress />;
  } else if (pkg.data) {
    return (
      <CodeEditorContextProvider>
        <MarketplacePackageEditContent pkg={pkg.data} />
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
