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

import { Link } from '@backstage/core-components';
import { Box, Button, ButtonIcon, Flex, Skeleton, Text } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoryData,
  PullRequestPreviewData,
  RepositorySelection,
} from '../../types';
import { urlHelper } from '../../utils/repository-utils';
import {
  BulkImportCloseIcon,
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import { bulkImportOpaqueSurfaceColor } from '../bulkImportSurfaces';
import { bulkImportTypographyH6 } from '../bulkImportTypography';
import { PreviewPullRequest } from './PreviewPullRequest';
import { PreviewPullRequests } from './PreviewPullRequests';

export const PreviewFileSidebarDrawerContent = ({
  repositoryType,
  onCancel,
  isLoading,
  isSubmitting,
  data,
  pullRequest,
  onSave,
  setPullRequest,
}: {
  repositoryType: string;
  onCancel: () => void;
  isLoading: boolean;
  isSubmitting: boolean | undefined;
  data: AddRepositoryData;
  pullRequest: PullRequestPreviewData;
  onSave: (pullRequest: PullRequestPreviewData, _event: any) => void;

  setPullRequest: (pullRequest: PullRequestPreviewData) => void;
}) => {
  const { t } = useTranslation();
  const [formErrors, setFormErrors] = useState<PullRequestPreviewData>();

  if (isLoading) {
    return (
      <Flex direction="column" gap="5" style={{ padding: '20px' }}>
        <Flex align="start" justify="between">
          <Skeleton width="80%" height={40} />
          <ButtonIcon
            icon={<BulkImportCloseIcon size={14} />}
            aria-label={t('previewFile.closeDrawer')}
            variant="tertiary"
            onPress={onCancel}
          />
        </Flex>
        <Skeleton width="100%" height={750} />
        <Skeleton width="100%" height={48} />
      </Flex>
    );
  }
  return (
    <Flex
      direction="column"
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Flex
          align="baseline"
          justify="between"
          style={{
            padding: '20px',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Flex
            direction="column"
            gap="1"
            align="start"
            style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}
          >
            {repositoryType === RepositorySelection.Repository ? (
              <>
                <Text as="h2" style={bulkImportTypographyH6}>
                  {`${data.orgName ?? data.organizationUrl}/${data.repoName}`}
                </Text>
                <span style={{ fontSize: '0.875rem', lineHeight: '1.5rem' }}>
                  <Link
                    to={data.repoUrl ?? ''}
                    style={bulkImportExternalLinkLinkStyle}
                  >
                    {urlHelper(data.repoUrl || '')}
                    <BulkImportExternalLinkIcon />
                  </Link>
                </span>
              </>
            ) : (
              <>
                <Text as="h2" style={bulkImportTypographyH6}>
                  {`${data.orgName}`}
                </Text>
                <span style={{ fontSize: '0.875rem', lineHeight: '1.5rem' }}>
                  <Link
                    to={data.organizationUrl ?? ''}
                    style={bulkImportExternalLinkLinkStyle}
                  >
                    {urlHelper(data.organizationUrl || '')}
                    <BulkImportExternalLinkIcon />
                  </Link>
                </span>
              </>
            )}
          </Flex>

          <ButtonIcon
            icon={<BulkImportCloseIcon size={14} />}
            aria-label={t('previewFile.closeDrawer')}
            variant="tertiary"
            onPress={onCancel}
          />
        </Flex>

        <Box
          style={{
            padding: '20px',
            paddingTop: '8px',
            paddingBottom: '8px',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {repositoryType === RepositorySelection.Repository && (
            <PreviewPullRequest
              repoId={data.id}
              repoUrl={data.repoUrl || ''}
              repoBranch={data.defaultBranch || 'main'}
              pullRequest={pullRequest}
              setPullRequest={setPullRequest}
              formErrors={formErrors as PullRequestPreviewData}
              setFormErrors={setFormErrors}
            />
          )}
          {repositoryType === RepositorySelection.Organization && (
            <PreviewPullRequests
              repositories={
                Object.values(data?.selectedRepositories || []) || []
              }
              pullRequest={pullRequest}
              formErrors={formErrors as PullRequestPreviewData}
              setFormErrors={setFormErrors}
              setPullRequest={setPullRequest}
            />
          )}
        </Box>
      </Box>
      <Flex
        align="center"
        gap="3"
        style={{
          flexShrink: 0,
          paddingTop: '20px',
          paddingBottom: '24px',
          paddingLeft: '24px',
          paddingRight: '24px',
          backgroundColor: bulkImportOpaqueSurfaceColor,
          borderTop: '1px solid var(--bui-border-1)',
        }}
      >
        <Button
          variant="primary"
          onPress={() => onSave(pullRequest, undefined)}
          isDisabled={
            isSubmitting ||
            (!!formErrors &&
              Object.values(formErrors).length > 0 &&
              Object.values(formErrors).some(
                fe => !!fe && Object.values(fe).length > 0,
              ))
          }
          isPending={isSubmitting}
        >
          {t('common.save')}
        </Button>
        <Button variant="secondary" onPress={onCancel}>
          {t('common.cancel')}
        </Button>
      </Flex>
    </Flex>
  );
};
