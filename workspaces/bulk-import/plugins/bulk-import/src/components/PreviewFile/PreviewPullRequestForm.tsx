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

import { useEffect, useMemo } from 'react';
import { useAsync } from 'react-use';

import { Entity, EntityMeta } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  humanizeEntityRef,
} from '@backstage/plugin-catalog-react';
import { Box, Checkbox, Combobox, Flex, Text, TextField } from '@backstage/ui';

import { Spinner } from '@patternfly/react-core';
import { FormikErrors, useFormik, useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  ApprovalTool,
  PullRequestPreview,
  PullRequestPreviewData,
} from '../../types';
import {
  convertKeyValuePairsToString,
  getValidationSchema,
  getYamlKeyValuePairs,
} from '../../utils/repository-utils';
import { bulkImportTypographyPreviewSection } from '../bulkImportTypography';
import { PreviewAutoResizeTextAreaField } from './PreviewAutoResizeTextAreaField';
import { PreviewCatalogInfoPreviewCard } from './PreviewCatalogInfoPreviewCard';
import { PreviewFloatingLabelField } from './PreviewFloatingLabelField';
import { PreviewPullRequestPreviewCard } from './PreviewPullRequestPreviewCard';

const previewFieldStyle = {
  width: '100%',
  maxWidth: '100%',
  marginTop: '16px',
  flex: '0 0 auto' as const,
};

const previewFloatingFieldControlStyle = {
  width: '100%',
  marginTop: 0,
  flex: '0 0 auto' as const,
};

/** Renders translation strings that emphasize segments with `*asterisks*`. */
const renderMessageWithEmphasis = (message: string) => {
  const parts: { key: string; content: string; emphasize: boolean }[] = [];
  const pattern = /(\*[^*]+\*)/g;
  let lastIndex = 0;
  let match = pattern.exec(message);

  while (match) {
    if (match.index > lastIndex) {
      parts.push({
        key: `text-${lastIndex}`,
        content: message.slice(lastIndex, match.index),
        emphasize: false,
      });
    }
    parts.push({
      key: `em-${match.index}`,
      content: match[0].slice(1, -1),
      emphasize: true,
    });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(message);
  }

  if (lastIndex < message.length) {
    parts.push({
      key: `text-${lastIndex}`,
      content: message.slice(lastIndex),
      emphasize: false,
    });
  }

  return parts.map(part =>
    part.emphasize ? (
      <Text key={part.key} as="em" variant="body-small">
        {part.content}
      </Text>
    ) : (
      <span key={part.key}>{part.content}</span>
    ),
  );
};

export const PreviewPullRequestForm = ({
  repoId,
  repoUrl,
  pullRequest,
  setPullRequest,
  formErrors,
  setFormErrors,
}: {
  repoId: string;
  repoUrl: string;
  pullRequest: PullRequestPreviewData;
  formErrors: PullRequestPreviewData;
  setPullRequest: (pullRequest: PullRequestPreviewData) => void;
  setFormErrors: (pullRequest: PullRequestPreviewData) => void;
}) => {
  const { t, tParams } = useTranslation();
  const { values } = useFormikContext<AddRepositoriesFormValues>();
  const catalogApi = useApi(catalogApiRef);

  const approvalToolLabel = {
    [ApprovalTool.Gitlab]: t('previewFile.pullRequest.mergeRequest'),
    [ApprovalTool.Git]: t('previewFile.pullRequest.title'),
    [ApprovalTool.ServiceNow]: t('previewFile.pullRequest.serviceNowTicket'),
  };

  const formik = useFormik<PullRequestPreview>({
    enableReinitialize: true,
    initialValues: pullRequest[repoId],
    initialErrors: formErrors?.[repoId] as unknown as
      FormikErrors<PullRequestPreview> | undefined,
    validationSchema: getValidationSchema(
      approvalToolLabel[values.approvalTool],
      t,
    ),
    onSubmit: () => undefined,
  });

  const { loading: entitiesLoading, value: entities } = useAsync(async () => {
    const allEntities = await catalogApi.getEntities({
      filter: {
        kind: ['group', 'user'],
      },
    });

    return allEntities.items
      .map(e => humanizeEntityRef(e, { defaultNamespace: 'true' }))
      .sort((a, b) => a.localeCompare(b));
  });

  const entityOwnerOptions = useMemo(
    () =>
      (entities ?? []).map(entity => ({
        id: entity,
        label: entity,
      })),
    [entities],
  );

  const entityOwnerLoadingSpinner = entitiesLoading ? (
    <Spinner size="sm" aria-label={t('previewFile.pullRequest.loadingText')} />
  ) : undefined;

  const updatePullRequestKeyValuePairFields = (
    field: string,
    value: string,
    yamlKey: string,
  ) => {
    const yamlUpdate: Entity = { ...formik.values?.yaml };
    if (formik.values?.[field as keyof PullRequestPreview] !== value) {
      formik.setFieldValue(field, value);
    }

    if (value.length === 0) {
      if (yamlKey.includes('.')) {
        // annotations or labels
        const [key, subKey] = yamlKey.split('.');
        if ((yamlUpdate[key as keyof Entity] as EntityMeta)?.[subKey]) {
          delete (yamlUpdate[key as keyof Entity] as EntityMeta)[subKey];
        }
      } else {
        // specs
        delete yamlUpdate[yamlKey as keyof Entity];
      }
    } else if (yamlKey.includes('.')) {
      const [key, subKey] = yamlKey.split('.');
      (yamlUpdate[key as keyof Entity] as EntityMeta)[subKey] =
        getYamlKeyValuePairs(value);
    } else {
      yamlUpdate.spec = getYamlKeyValuePairs(value);
    }

    setPullRequest({
      ...pullRequest,
      [repoId]: {
        ...formik.values,
        [field]: value,
        yaml: yamlUpdate,
      },
    });
  };

  const updateField = (field: string, value: string | boolean) => {
    if (formik.values?.[field as keyof PullRequestPreview] !== value) {
      formik.setFieldValue(field, value);
    }

    const pr: PullRequestPreviewData = {
      [repoId]: {
        ...formik.values,
        [field]: value,
        ...(field === 'componentName' && typeof value === 'string'
          ? {
              yaml: {
                ...formik.values?.yaml,
                metadata: {
                  ...formik.values?.yaml.metadata,
                  name: value,
                },
              },
            }
          : {}),
        ...(field === 'entityOwner'
          ? {
              yaml: {
                ...formik.values?.yaml,
                spec: {
                  ...formik.values?.yaml.spec,
                  owner: value,
                },
              },
            }
          : {}),
      },
    };
    setPullRequest({ ...pullRequest, ...pr });
  };

  const handleNamedChange = (
    targetName: string,
    inputValue: string | boolean,
  ) => {
    switch (targetName) {
      case 'prTitle':
      case 'prDescription':
      case 'entityOwner':
      case 'componentName':
      case 'useCodeOwnersFile':
        updateField(targetName, inputValue);
        break;

      case 'prAnnotations':
        updatePullRequestKeyValuePairFields(
          'prAnnotations',
          String(inputValue),
          'metadata.annotations',
        );
        break;
      case 'prLabels':
        updatePullRequestKeyValuePairFields(
          'prLabels',
          String(inputValue),
          'metadata.labels',
        );
        break;
      case 'prSpec':
        updatePullRequestKeyValuePairFields(
          'prSpec',
          String(inputValue),
          'spec',
        );
        break;
      default:
        break;
    }
  };

  const keyValueTextFields = [
    {
      label: t('previewFile.pullRequest.annotations'),
      name: 'prAnnotations',
      value:
        formik.values?.prAnnotations ??
        convertKeyValuePairsToString(
          formik.values?.yaml?.metadata?.annotations,
        ),
    },
    {
      label: t('previewFile.pullRequest.labels'),
      name: 'prLabels',
      value:
        formik.values?.prLabels ??
        convertKeyValuePairsToString(formik.values?.yaml?.metadata?.labels),
    },
    {
      label: t('previewFile.pullRequest.spec'),
      name: 'prSpec',
      value:
        formik.values?.prSpec ??
        convertKeyValuePairsToString(
          formik.values?.yaml?.spec as Record<string, string>,
        ),
    },
  ];

  useEffect(() => {
    const err = {
      ...formErrors,
      [repoId]: formik.errors as unknown as PullRequestPreview,
    };

    if (!formik.errors) {
      delete err[repoId];
    }

    setFormErrors(err);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.errors]);

  const pullRequestTitleLabel = tParams('previewFile.pullRequest.titleLabel', {
    tool: approvalToolLabel[values.approvalTool],
  });
  const pullRequestBodyLabel = tParams('previewFile.pullRequest.bodyLabel', {
    tool: approvalToolLabel[values.approvalTool],
  });

  return (
    <>
      <Box style={{ marginTop: '16px' }}>
        <Text as="h3" style={bulkImportTypographyPreviewSection}>
          {tParams('previewFile.pullRequest.details', {
            tool: approvalToolLabel[values.approvalTool],
          })}
        </Text>
      </Box>
      <PreviewFloatingLabelField
        label={pullRequestTitleLabel}
        required
        hasValue={!!formik.values?.prTitle?.trim()}
        description={formik.errors?.prTitle}
        isInvalid={!!formik.errors?.prTitle}
        style={previewFieldStyle}
      >
        <TextField
          name="prTitle"
          aria-label={pullRequestTitleLabel}
          placeholder={t('previewFile.pullRequest.titlePlaceholder')}
          value={formik.values?.prTitle ?? ''}
          onChange={value => handleNamedChange('prTitle', value)}
          isInvalid={!!formik.errors?.prTitle}
          isRequired
          size="small"
          style={previewFloatingFieldControlStyle}
        />
      </PreviewFloatingLabelField>
      <PreviewFloatingLabelField
        label={pullRequestBodyLabel}
        required
        multiline
        hasValue={!!formik.values?.prDescription?.trim()}
        description={formik.errors?.prDescription}
        isInvalid={!!formik.errors?.prDescription}
        style={previewFieldStyle}
      >
        <PreviewAutoResizeTextAreaField
          name="prDescription"
          aria-label={pullRequestBodyLabel}
          placeholder={t('previewFile.pullRequest.bodyPlaceholder')}
          value={formik.values?.prDescription ?? ''}
          onChange={value => handleNamedChange('prDescription', value)}
          isInvalid={!!formik.errors?.prDescription}
          isRequired
          size="small"
          style={previewFloatingFieldControlStyle}
        />
      </PreviewFloatingLabelField>
      <Box style={{ marginTop: '16px' }}>
        <Text as="h3" style={bulkImportTypographyPreviewSection}>
          {t('previewFile.pullRequest.entityConfiguration')}
        </Text>
      </Box>
      <PreviewFloatingLabelField
        label={t('previewFile.pullRequest.componentNameLabel')}
        required
        hasValue={!!formik.values?.componentName?.trim()}
        description={formik.errors?.componentName}
        isInvalid={!!formik.errors?.componentName}
        style={previewFieldStyle}
      >
        <TextField
          name="componentName"
          aria-label={t('previewFile.pullRequest.componentNameLabel')}
          placeholder={t('previewFile.pullRequest.componentNamePlaceholder')}
          value={formik.values?.componentName ?? ''}
          onChange={value => handleNamedChange('componentName', value)}
          isInvalid={!!formik.errors?.componentName}
          isRequired
          size="small"
          style={previewFloatingFieldControlStyle}
        />
      </PreviewFloatingLabelField>
      {!formik.values?.useCodeOwnersFile && (
        <PreviewFloatingLabelField
          label={t('previewFile.pullRequest.entityOwnerLabel')}
          required
          combobox
          hasValue={!!formik.values?.entityOwner?.trim()}
          description={
            formik.errors?.entityOwner ||
            t('previewFile.pullRequest.entityOwnerHelper')
          }
          isInvalid={!!formik.errors?.entityOwner}
          style={previewFieldStyle}
        >
          <Combobox
            name="entityOwner"
            aria-label={t('previewFile.pullRequest.entityOwnerLabel')}
            placeholder={t('previewFile.pullRequest.entityOwnerPlaceholder')}
            isRequired
            options={entityOwnerOptions}
            selectedKey={formik.values?.entityOwner || null}
            onSelectionChange={key =>
              handleNamedChange(
                'entityOwner',
                key === null || key === undefined ? '' : String(key),
              )
            }
            search={{
              mode: 'client',
              inputValue: formik.values?.entityOwner ?? '',
              onInputChange: value => handleNamedChange('entityOwner', value),
            }}
            loading={
              entitiesLoading ? { state: 'loading' as const } : undefined
            }
            icon={entityOwnerLoadingSpinner}
            size="small"
            style={previewFloatingFieldControlStyle}
          />
        </PreviewFloatingLabelField>
      )}
      <Flex direction="column" gap="2" style={{ marginTop: '16px' }}>
        <Checkbox
          name="useCodeOwnersFile"
          isSelected={!!formik.values?.useCodeOwnersFile}
          onChange={checked => handleNamedChange('useCodeOwnersFile', checked)}
        >
          <Text as="span" variant="body-small">
            {renderMessageWithEmphasis(
              t('previewFile.pullRequest.useCodeOwnersFile'),
            )}
          </Text>
        </Checkbox>
        <Text variant="body-small">
          {t('previewFile.pullRequest.codeOwnersWarning')}
        </Text>
      </Flex>
      {keyValueTextFields.map(field => {
        const fieldError = formik.errors?.[
          field.name as keyof PullRequestPreview
        ] as string | undefined;

        const helperText =
          fieldError ||
          tParams('previewFile.useSemicolonSeparator', {
            label: field.label.toLocaleLowerCase('en-US'),
          });

        return (
          <PreviewFloatingLabelField
            key={field.name}
            label={field.label}
            multiline
            hasValue={!!field.value?.trim()}
            description={helperText}
            isInvalid={!!fieldError}
            style={previewFieldStyle}
          >
            <PreviewAutoResizeTextAreaField
              name={field.name}
              aria-label={field.label}
              placeholder={t('previewFile.keyValuePlaceholder')}
              value={field.value ?? ''}
              onChange={value => handleNamedChange(field.name, value)}
              isInvalid={!!fieldError}
              size="small"
              style={previewFloatingFieldControlStyle}
            />
          </PreviewFloatingLabelField>
        );
      })}
      <Box style={{ marginTop: '16px' }}>
        <Text as="h3" style={bulkImportTypographyPreviewSection}>
          {t('previewFile.preview')}{' '}
          {approvalToolLabel[values.approvalTool].toLowerCase()}
        </Text>
      </Box>
      <PreviewPullRequestPreviewCard
        title={formik.values?.prTitle ?? ''}
        description={formik.values?.prDescription ?? ''}
      />
      <Box style={{ marginTop: '16px', marginBottom: '8px' }}>
        <Text as="h3" style={bulkImportTypographyPreviewSection}>
          {t('previewFile.pullRequest.previewEntities')}
        </Text>
      </Box>
      <PreviewCatalogInfoPreviewCard
        entities={[formik.values?.yaml]}
        repositoryUrl={repoUrl}
      />
    </>
  );
};
