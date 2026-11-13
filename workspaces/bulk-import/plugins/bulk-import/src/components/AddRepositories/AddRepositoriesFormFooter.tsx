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

import { Link } from '@backstage/core-components';
import { Button, Flex, Tooltip, TooltipTrigger } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoriesFormValues, ApprovalTool } from '../../types';
import { bulkImportOpaqueSurfaceColor } from '../bulkImportSurfaces';

export const AddRepositoriesFormFooter = () => {
  const { t } = useTranslation();
  const { values, handleSubmit, isSubmitting } =
    useFormikContext<AddRepositoriesFormValues>();

  const isPluralRepositories =
    Object.keys(values.repositories || []).length > 1;

  const getGitSubmitTitle = () => {
    return t('common.import');
  };

  const label = {
    [ApprovalTool.ServiceNow]: {
      submitTitle: isPluralRepositories
        ? t('forms.footer.createServiceNowTickets')
        : t('forms.footer.createServiceNowTicket'),
      toolTipTitle: t('forms.footer.serviceNowTooltip'),
    },
    [ApprovalTool.Gitlab]: {
      submitTitle: t('common.import'),
      toolTipTitle: t('forms.footer.importTooltip'),
    },
    [ApprovalTool.Git]: {
      submitTitle: getGitSubmitTitle(),
      toolTipTitle: t('forms.footer.importTooltip'),
    },
  };

  const disableCreate =
    !values.repositories || Object.values(values.repositories).length === 0;

  const getTooltipTitle = () => {
    if (disableCreate) {
      return t('forms.footer.selectRepositoryTooltip');
    }
    return label[values.approvalTool]?.toolTipTitle;
  };

  const submitButton = (
    <Button
      variant="primary"
      onPress={() => handleSubmit()}
      isDisabled={disableCreate || isSubmitting}
      isPending={isSubmitting}
    >
      {label[values.approvalTool]?.submitTitle}
    </Button>
  );

  return (
    <Flex
      align="center"
      gap="3"
      pt="4"
      pb="8"
      pl="6"
      data-testid="add-repository-footer"
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        zIndex: 10,
        backgroundColor: bulkImportOpaqueSurfaceColor,
        borderTop: '1px solid var(--bui-border-1)',
        boxSizing: 'border-box',
      }}
    >
      {disableCreate ? (
        <TooltipTrigger>
          <span>{submitButton}</span>
          <Tooltip placement="top">{getTooltipTitle()}</Tooltip>
        </TooltipTrigger>
      ) : (
        submitButton
      )}
      <Link to="/bulk-import">
        <Button variant="secondary">{t('common.cancel')}</Button>
      </Link>
    </Flex>
  );
};
