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

import { useEffect, useState, useCallback } from 'react';

import {
  ErrorPage,
  MarkdownContent,
  Progress,
} from '@backstage/core-components';

import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import { Flex } from '@backstage/ui';

import yaml from 'yaml';
import { useNavigate } from 'react-router-dom';

import {
  ExtensionsPackageAppConfigExamples,
  ExtensionsPackage,
  ExtensionsPackageSpec,
  ExtensionsPlugin,
  ExtensionsPluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import AlertTitle from '@mui/material/AlertTitle';
import { useTheme } from '@mui/material/styles';

import { pluginInstallRouteRef, pluginRouteRef } from '../routes';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginPackages } from '../hooks/usePluginPackages';
import {
  ExtensionsStatus,
  getPluginActionTooltipMessage,
  isPluginInstalled,
} from '../utils';
import { Permission } from '../types';

import { CodeEditorContextProvider, useCodeEditor } from './CodeEditorContext';
import {
  InstallationType,
  useInstallationContext,
} from './InstallationContext';

import { usePluginConfigurationPermissions } from '../hooks/usePluginConfigurationPermissions';
import { usePluginConfig } from '../hooks/usePluginConfig';
import { useInstallPlugin } from '../hooks/useInstallPlugin';
import { useNodeEnvironment } from '../hooks/useNodeEnvironment';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';
import { mapExtensionsPluginInstallStatusToInstallPageButton } from '../labels';
import { useTranslation } from '../hooks/useTranslation';
import { CodeEditorCard } from './CodeEditorCard';
import { TabPanel } from './TabPanel';
import { InstallationWarning } from './InstallationWarning';

interface TabItem {
  label: string;
  content: string | ExtensionsPackageAppConfigExamples[];
  key: string;
  others?: { [key: string]: any };
}

export const ExtensionsPluginInstallContent = ({
  plugin,
  packages,
}: {
  plugin: ExtensionsPlugin;
  packages: ExtensionsPackage[];
}) => {
  const { t } = useTranslation();
  const { mutateAsync: installPlugin } = useInstallPlugin();
  const { installedPlugins, setInstalledPlugins } = useInstallationContext();
  const params = useRouteRefParams(pluginInstallRouteRef);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [installationError, setInstallationError] = useState<string | null>(
    null,
  );
  const pluginConfig = usePluginConfig(params.namespace, params.name);
  const pluginConfigPermissions = usePluginConfigurationPermissions(
    params.namespace,
    params.name,
  );
  const extensionsConfig = useExtensionsConfiguration();
  const nodeEnvironment = useNodeEnvironment();
  const isProductionEnvironment =
    nodeEnvironment?.data?.nodeEnv === 'production';

  const theme = useTheme();
  // TODO: add divider color in theme plugin
  const dividerColor = theme.palette.mode === 'dark' ? '#A3A3A3' : '#C7C7C7';

  const codeEditor = useCodeEditor();

  const pluginLink = useRouteRef(pluginRouteRef)({
    namespace: params.namespace,
    name: params.name,
  });

  const onLoaded = useCallback(() => {
    setInstallationError(null);

    if (pluginConfig.isLoading) return;

    if (pluginConfig.data?.configYaml) {
      const configArray = yaml.parseDocument(pluginConfig.data.configYaml);

      const configObject = {
        plugins: configArray,
      };

      const configYaml = yaml.stringify(configObject);
      codeEditor.setValue(configYaml);
    } else {
      const dynamicPluginYaml = {
        plugins: (packages ?? []).map(pkg => {
          const pkgEntry: ExtensionsPackageSpec = {
            package: pkg.spec?.dynamicArtifact ?? './dynamic-plugins/dist/....',
            disabled: false,
          };
          if (pkg.spec?.integrity) {
            pkgEntry.integrity = pkg.spec.integrity;
          }
          return pkgEntry;
        }),
      };
      codeEditor.setValue(yaml.stringify(dynamicPluginYaml));
    }
  }, [codeEditor, packages, pluginConfig.data, pluginConfig.isLoading]);

  const onReset = useCallback(() => {
    pluginConfig.refetch();
    onLoaded();
  }, [onLoaded, pluginConfig]);

  useEffect(() => {
    onLoaded();
  }, [onLoaded, pluginConfig.data?.configYaml]);

  const examples = packages
    .map(pkg =>
      Array.isArray(pkg?.spec?.appConfigExamples) &&
      pkg.spec.appConfigExamples.length > 0
        ? { [`${pkg.metadata.name}`]: pkg.spec.appConfigExamples }
        : null,
    )
    .filter(Boolean);
  const packageDynamicArtifacts = packages.reduce((acc, pkg) => {
    const temp = {
      ...acc,
      [`${pkg.metadata.name}`]: pkg.spec?.dynamicArtifact,
    };
    return temp;
  }, {});
  const installationInstructions = plugin.spec?.installation;
  const aboutMarkdown = plugin.spec?.description;
  const availableTabs = [
    examples.length > 0 && {
      label: t('install.examples'),
      content: examples,
      key: 'examples',
      others: { packageNames: packageDynamicArtifacts },
    },
    installationInstructions && {
      label: t('install.settingUpPlugin'),
      content: installationInstructions,
      key: 'installation',
    },
    aboutMarkdown && {
      label: t('install.aboutPlugin'),
      content: aboutMarkdown,
      key: 'about',
    },
  ].filter(tab => tab) as TabItem[];

  const showRightCard = examples || installationInstructions || aboutMarkdown;
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_: any, newValue: React.SetStateAction<number>) => {
    setTabIndex(newValue);
  };

  const handleInstall = async () => {
    setIsSubmitting(true);
    const content = yaml.parseDocument(codeEditor.getValue() ?? '');
    const pluginsArray = content.get('plugins');

    const pluginsYaml = new yaml.Document(pluginsArray);
    const pluginsYamlString = pluginsYaml.toString();

    try {
      const res = await installPlugin({
        namespace: plugin.metadata.namespace ?? 'default',
        name: plugin.metadata.name,
        configYaml: pluginsYamlString,
      });
      if (res?.status === 'OK') {
        const updatedPlugins: InstallationType = {
          ...installedPlugins,
          [plugin.metadata.title ?? plugin.metadata.name]: isPluginInstalled(
            plugin?.spec?.installStatus,
          )
            ? t('install.pluginUpdated')
            : t('install.pluginInstalled'),
        };
        setInstalledPlugins(updatedPlugins);
        navigate('/extensions');
      } else {
        setIsSubmitting(false);
        setInstallationError((res as any)?.error?.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setInstallationError(err?.error?.message);
    }
  };

  const missingDynamicArtifact = packages.some(p => !p.spec?.dynamicArtifact);

  const isInstallDisabled =
    isProductionEnvironment ||
    installationError ||
    pluginConfigPermissions.data?.write !== Permission.ALLOW ||
    (pluginConfig.data as any)?.error ||
    !extensionsConfig?.data?.enabled ||
    isSubmitting ||
    packages.length === 0 ||
    missingDynamicArtifact;

  const installTooltip = getPluginActionTooltipMessage(
    isProductionEnvironment,
    {
      read: pluginConfigPermissions.data?.read ?? Permission.DENY,
      write: pluginConfigPermissions.data?.write ?? Permission.DENY,
    },
    t,
    !extensionsConfig?.data?.enabled,
    missingDynamicArtifact,
  );

  const showInstallationWarning =
    (pluginConfig.data as any)?.error?.message &&
    (pluginConfig.data as any)?.error?.reason !==
      ExtensionsStatus.INSTALLATION_DISABLED &&
    (pluginConfig.data as any)?.error?.reason !==
      ExtensionsStatus.INSTALLATION_DISABLED_IN_PRODUCTION;

  const getInstallButtonDatatestid = () => {
    if (isInstallDisabled) {
      return isPluginInstalled(plugin?.spec?.installStatus) &&
        !isProductionEnvironment
        ? 'edit-disabled'
        : 'install-disabled';
    }
    return isPluginInstalled(plugin.spec?.installStatus) ? 'edit' : 'install';
  };

  const getCardHeaderTitle = () => {
    if (isProductionEnvironment || isInstallDisabled) {
      return t('install.instructions');
    }
    if (isPluginInstalled(plugin.spec?.installStatus)) {
      return t('install.editInstructions');
    }
    return t('install.installationInstructions');
  };

  return (
    <Flex direction="column" gap="4" style={{ height: '100% ' }}>
      {/* Content above the two sided "editor area" */}
      {showInstallationWarning && (
        <InstallationWarning configData={pluginConfig.data} />
      )}
      {installationError && <Alert severity="error">{installationError}</Alert>}
      {missingDynamicArtifact && (
        <Alert severity="error">
          <AlertTitle>
            {t('alert.missingDynamicArtifactTitlePlugin')}
          </AlertTitle>
          <MarkdownContent
            content={t('alert.missingDynamicArtifactForPlugin')}
          />
        </Alert>
      )}

      {/* "two sided content area" */}
      <Flex direction="row" style={{ flexGrow: 1 }}>
        <Flex style={{ flex: 65 }}>
          {packages.length > 0 && <CodeEditorCard onLoad={onLoaded} />}
        </Flex>

        {showRightCard && (
          <Flex style={{ flex: 55 }}>
            <Card style={{ width: '100%' }}>
              <div style={{ flex: '1 1 0', overflow: 'scroll' }}>
                <CardHeader
                  title={
                    <Typography variant="h3">{getCardHeaderTitle()}</Typography>
                  }
                />
                <CardContent
                  sx={{
                    px: 0 /* removes padding left and right of the tab underline */,
                  }}
                >
                  {availableTabs.length > 1 && (
                    <Tabs
                      value={tabIndex}
                      onChange={handleTabChange}
                      aria-label={t('install.pluginTabs')}
                      sx={{ px: 0 }}
                    >
                      {availableTabs.map((tab, index) => (
                        <Tab
                          key={tab.key}
                          value={index}
                          label={tab.label ?? ''}
                        />
                      ))}
                    </Tabs>
                  )}
                  {availableTabs.map(
                    (tab, index) =>
                      tabIndex === index && (
                        <TabPanel
                          key={tab.key}
                          value={tabIndex}
                          index={index}
                          markdownContent={tab.content ?? ''}
                          others={tab.others}
                          title={
                            availableTabs.length === 1
                              ? availableTabs[0].label
                              : ''
                          }
                        />
                      ),
                  )}
                </CardContent>
              </div>
            </Card>
          </Flex>
        )}
      </Flex>

      <Box
        sx={{
          mx: '-24px',
          my: 2,
          borderBottom: `1px solid ${dividerColor}`,
        }}
      />

      {/* Button bar */}
      <Flex gap="4">
        <Tooltip
          title={
            installTooltip ? (
              <div
                style={{
                  whiteSpace: 'normal',
                  maxWidth: 250,
                  overflowWrap: 'break-word',
                }}
              >
                {installTooltip}
              </div>
            ) : (
              ''
            )
          }
        >
          <Typography component="span">
            <Button
              variant="contained"
              color="primary"
              onClick={handleInstall}
              disabled={isInstallDisabled}
              data-testid={getInstallButtonDatatestid()}
              startIcon={
                isSubmitting && <CircularProgress size="20px" color="inherit" />
              }
            >
              {mapExtensionsPluginInstallStatusToInstallPageButton(
                plugin.spec?.installStatus ??
                  ExtensionsPluginInstallStatus.NotInstalled,
                t,
              )}
            </Button>
          </Typography>
        </Tooltip>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate(pluginLink)}
          data-testId={isInstallDisabled ? 'back-button' : 'cancel-button'}
        >
          {isInstallDisabled ? t('install.back') : t('install.cancel')}
        </Button>
        {(pluginConfigPermissions.data?.write === Permission.ALLOW ||
          pluginConfigPermissions.data?.read === Permission.ALLOW) && (
          <Button
            variant="text"
            color="primary"
            onClick={onReset}
            sx={{ ml: 2 }}
          >
            {t('install.reset')}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export const ExtensionsPluginInstallContentLoader = () => {
  const { t } = useTranslation();
  const params = useRouteRefParams(pluginInstallRouteRef);

  const plugin = usePlugin(params.namespace, params.name);
  const packages = usePluginPackages(params.namespace, params.name);

  if (plugin.isLoading || packages.isLoading) {
    return <Progress />;
  } else if (plugin.data && packages.data) {
    return (
      <CodeEditorContextProvider>
        <ExtensionsPluginInstallContent
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
      statusMessage={t('metadata.pluginNotFound', {
        name: `${params.namespace}/${params.name}`,
      } as any)}
    />
  );
};
