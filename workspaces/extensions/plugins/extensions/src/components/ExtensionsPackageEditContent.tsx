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

import { useCallback, useEffect, useState } from 'react';

import {
  ErrorPage,
  MarkdownContent,
  Progress,
} from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';

import { useLocation, useNavigate } from 'react-router-dom';

import {
  ExtensionsPackage,
  ExtensionsPackageAppConfigExamples,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import AlertTitle from '@mui/material/AlertTitle';
import Tooltip from '@mui/material/Tooltip';

import { packageInstallRouteRef } from '../routes';

import { CodeEditorContextProvider, useCodeEditor } from './CodeEditorContext';
import { useInstallPackage } from '../hooks/useInstallPackage';
import { usePackage } from '../hooks/usePackage';
import { usePackageConfig } from '../hooks/usePackageConfig';
import { CodeEditorCard } from './CodeEditorCard';
import { TabPanel } from './TabPanel';
import { useInstallationContext } from './InstallationContext';
import { useTranslation } from '../hooks/useTranslation';
import { ExtensionsStatus, getPluginActionTooltipMessage } from '../utils';
import { InstallationWarning } from './InstallationWarning';

interface TabItem {
  label: string;
  content: string | ExtensionsPackageAppConfigExamples[];
  key: string;
  others?: { [key: string]: any };
}

export const ExtensionsPackageEditContent = ({
  pkg,
}: {
  pkg: ExtensionsPackage;
}) => {
  const { t } = useTranslation();
  const { mutateAsync: installPackage } = useInstallPackage();
  const [hasGlobalHeader, setHasGlobalHeader] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const header = document.querySelector('nav#global-header');
    setHasGlobalHeader(Boolean(header));
  }, []);

  const dynamicHeight = hasGlobalHeader
    ? 'calc(100vh - 220px)'
    : 'calc(100vh - 160px)';

  const codeEditor = useCodeEditor();
  const params = useRouteRefParams(packageInstallRouteRef);
  const pkgConfig = usePackageConfig(params.namespace, params.name);

  // Seed editor when the Monaco editor mounts (avoids race when config arrives before editor)
  const onLoaded = useCallback(() => {
    const existing = pkgConfig.data?.configYaml;
    if (existing) {
      // Wrap backend single-map YAML under plugins list using simple string ops
      const lines = (existing || '').split('\n');
      const first = lines[0] ?? '';
      const isAlreadyItem = /^\s*-\s+/.test(first);
      const wrapped = isAlreadyItem
        ? ['plugins:', ...lines.map(l => (l ? `  ${l}` : l))]
        : [
            'plugins:',
            `- ${first}`,
            ...lines.slice(1).map(l => (l ? `  ${l}` : l)),
          ];
      codeEditor.setValue(wrapped.filter(l => l !== undefined).join('\n'));
      return;
    }
    if (pkgConfig.isSuccess && !existing) {
      const path = pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....';
      const yamlContent = `plugins:\n  - package: ${JSON.stringify(path)}\n    disabled: false\n`;
      codeEditor.setValue(yamlContent);
    }
  }, [
    codeEditor,
    pkgConfig.data?.configYaml,
    pkgConfig.isSuccess,
    pkg.spec?.dynamicArtifact,
  ]);

  const navigate = useNavigate();
  const location = useLocation();
  const { installedPackages, setInstalledPackages } = useInstallationContext();
  const queryClient = useQueryClient();
  const disableSave =
    !pkg.spec?.dynamicArtifact ||
    location?.state?.viewOnly ||
    Boolean(configError);

  // Populate editor from backend config when available; otherwise set default template once
  useEffect(() => {
    const existing = pkgConfig.data?.configYaml;
    const isLoadingConfig = (pkgConfig as any)?.isLoading;
    if (!isLoadingConfig && (pkgConfig.data as any)?.error) {
      setConfigError((pkgConfig.data as any)?.error.reason);
    }
    if (!existing && !isLoadingConfig) {
      // Seed default only if editor is empty to avoid overwriting existing content
      const current = codeEditor.getValue();
      if (!current || current.trim() === '') {
        const path = pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....';
        const yamlContent = `plugins:\n  - package: ${JSON.stringify(path)}\n    disabled: false\n`;
        codeEditor.setValue(yamlContent);
      }
      return;
    }
    if (existing) {
      // Wrap backend single-map YAML under plugins list using simple string ops
      const lines = (existing || '').split('\n');
      const first = lines[0] ?? '';
      const isAlreadyItem = /^\s*-\s+/.test(first);
      const wrapped = isAlreadyItem
        ? ['plugins:', ...lines.map(l => (l ? `  ${l}` : l))]
        : [
            'plugins:',
            `- ${first}`,
            ...lines.slice(1).map(l => (l ? `  ${l}` : l)),
          ];
      codeEditor.setValue(wrapped.filter(l => l !== undefined).join('\n'));
    }
  }, [
    pkgConfig,
    pkgConfig.data?.configYaml,
    params.namespace,
    params.name,
    codeEditor,
    pkg.spec?.dynamicArtifact,
  ]);

  const examples = [
    {
      [`${pkg.metadata.name}`]: pkg.spec?.appConfigExamples,
    },
  ];
  const packageDynamicArtifacts = {
    [`${pkg.metadata.name}`]: pkg.spec?.dynamicArtifact,
  };

  const packageExamples =
    Array.isArray(examples) && examples.length > 0
      ? Object.values(examples[0])?.[0]
      : [];

  const hasPackageExamples =
    Array.isArray(packageExamples) && packageExamples.length > 0;

  const availableTabs = hasPackageExamples
    ? ([
        {
          label: t('install.examples'),
          content: examples,
          key: 'examples',
          others: { packageNames: packageDynamicArtifacts },
        },
      ] as TabItem[])
    : [];

  const showRightCard = hasPackageExamples;

  const showEditWarning =
    (pkgConfig.data as any)?.error?.message &&
    (pkgConfig.data as any)?.error?.reason !==
      ExtensionsStatus.INSTALLATION_DISABLED &&
    (pkgConfig.data as any)?.error?.reason !==
      ExtensionsStatus.INSTALLATION_DISABLED_IN_PRODUCTION;

  const handleSave = async () => {
    try {
      setSaveError(null);
      setIsSubmitting(true);
      const raw = codeEditor.getValue() ?? '';

      // Extract the first package item under plugins and convert to a single-map YAML (no leading dash)
      const lines = raw.split('\n');
      const pluginsIdx = lines.findIndex(l => /^\s*plugins\s*:/i.test(l));
      if (pluginsIdx === -1)
        throw new Error(t('install.errors.missingPluginsList'));
      let i = pluginsIdx + 1;
      // Skip blank lines
      while (i < lines.length && lines[i].trim() === '') i += 1;
      const startLine = lines[i] || '';
      const startMatch = startLine.match(/^(\s*)-\s+/);
      if (!startMatch) throw new Error(t('install.errors.missingPackageItem'));
      const itemIndent = startMatch[1].length; // indent before '- '
      const firstLine = startLine.replace(/^(\s*)-\s+/, '');
      const pkgLines: string[] = [firstLine];
      // Subsequent lines that are part of this list item must be indented at least itemIndent+2
      for (let j = i + 1; j < lines.length; j += 1) {
        const line = lines[j] ?? '';
        // If we hit another sibling list item at the same indent, stop
        const siblingMatch = line.match(/^(\s*)-\s+/);
        if (siblingMatch && siblingMatch[1].length === itemIndent) break;
        // Remove exactly one indent level (itemIndent + 2 spaces) if present
        const removeIndent = new RegExp(`^\\s{${itemIndent + 2}}`);
        pkgLines.push(line.replace(removeIndent, ''));
      }
      // Finalize single-map YAML
      const packageYamlString = pkgLines
        .join('\n')
        .replace(/^\s*[-]\s*/m, '') // NOSONAR
        .replace(/\r/g, '')
        .replace(/^\s*$/gm, '')
        .trim();
      // Validate minimal shape before POST
      if (!/^package\s*:/m.test(packageYamlString)) {
        setIsSubmitting(false);
        setSaveError(t('install.errors.missingPackageField'));
        return;
      }

      const res = await installPackage({
        namespace: pkg.metadata.namespace ?? params.namespace,
        name: pkg.metadata.name,
        configYaml: packageYamlString.trim(),
      });

      if ((res as any)?.status === 'OK') {
        const updated = {
          ...installedPackages,
          [pkg.metadata.title ?? pkg.metadata.name]: t(
            'install.packageUpdated',
          ),
        };
        setInstalledPackages(updated);
        queryClient.invalidateQueries({
          queryKey: [
            'extensionsApi',
            'getPackageConfigByName',
            pkg.metadata.namespace ?? params.namespace,
            pkg.metadata.name,
          ],
        });
        const preserved = new URLSearchParams(location.search);
        navigate(`/extensions/installed-packages?${preserved.toString()}`);
      } else {
        setSaveError(
          (res as any)?.error?.message ?? t('install.errors.failedToSave'),
        );
        setIsSubmitting(false);
      }
    } catch (e: any) {
      setSaveError(e?.error?.message ?? t('install.errors.failedToSave'));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showEditWarning && <InstallationWarning configData={pkgConfig.data} />}
      {saveError && (
        <Alert severity="error" sx={{ mb: '1rem' }}>
          {saveError}
        </Alert>
      )}
      {!pkg.spec?.dynamicArtifact && (
        <Alert severity="error" sx={{ mb: '1rem' }}>
          <AlertTitle>{t('alert.missingDynamicArtifactTitle')}</AlertTitle>
          <MarkdownContent content={t('alert.missingDynamicArtifact')} />
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: '1rem' }}>
          {saveError}
        </Alert>
      )}

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
                      {disableSave
                        ? t('install.instructions')
                        : t('install.editInstructions')}
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
                      {t('install.download')}
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
                  <Box
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {availableTabs.map((tab, index) => (
                      <TabPanel
                        key={tab.key}
                        value={0}
                        index={index}
                        markdownContent={tab.content ?? ''}
                        others={tab.others}
                      />
                    ))}
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
          <Tooltip
            title={getPluginActionTooltipMessage(
              configError ===
                ExtensionsStatus.INSTALLATION_DISABLED_IN_PRODUCTION,
              null,
              t,
              configError === ExtensionsStatus.INSTALLATION_DISABLED,
              !pkg.spec?.dynamicArtifact,
              false,
            )}
          >
            <Typography component="span">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isSubmitting || disableSave}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size="20px" color="inherit" />
                  ) : undefined
                }
              >
                {t('button.save')}
              </Button>
            </Typography>
          </Tooltip>
          <Button
            variant="outlined"
            color="primary"
            sx={{ ml: 2 }}
            onClick={() => {
              const ns = pkg.metadata.namespace ?? params.namespace;
              const name = pkg.metadata.name;
              const preserved = new URLSearchParams(location.search);
              if (location?.state?.editAction) {
                navigate(
                  `/extensions/installed-packages?${preserved.toString()}`,
                );
              } else {
                navigate(
                  `/extensions/installed-packages/${ns}/${name}?${preserved.toString()}`,
                );
              }
            }}
          >
            {t('install.cancel')}
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={onLoaded}
            sx={{ ml: 3 }}
          >
            {t('install.reset')}
          </Button>
        </Box>
      </Box>
    </>
  );
};

export const ExtensionsPackageEditContentLoader = () => {
  const { t } = useTranslation();
  const params = useRouteRefParams(packageInstallRouteRef);

  const pkg = usePackage(params.namespace, params.name);

  if (pkg.isLoading) {
    return <Progress />;
  } else if (pkg.data) {
    return (
      <CodeEditorContextProvider>
        <ExtensionsPackageEditContent pkg={pkg.data} />
      </CodeEditorContextProvider>
    );
  } else if (pkg.error) {
    return <ErrorPage statusMessage={pkg.error.toString()} />;
  }
  return (
    <ErrorPage
      statusMessage={t('package.notFound', {
        namespace: params.namespace,
        name: params.name,
      } as any)}
    />
  );
};
