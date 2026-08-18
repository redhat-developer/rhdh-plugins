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

import { useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import type { CatalogItem } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { VerticalTabDialog } from '../../../components/VerticalTabDialog';
import { UserValueFields } from '../../../components/UserValueFields';
import { useTranslation } from '../../../hooks/useTranslation';
import { useWizardState } from '../../../hooks/useWizardState';
import {
  buildResourceUserValues,
  isInstanceFormValid,
  validateInstanceForm,
  validateUserValues,
} from '../instanceFormTypes';
import type { InstanceForm, ResourceUserValues } from '../instanceFormTypes';

const useStyles = makeStyles(theme => ({
  catalogItemBadge: {
    marginLeft: theme.spacing(1),
  },
}));

// ─── Overview Tab ─────────────────────────────────────────────────────────────

type ScalarField = 'display_name' | 'catalog_item_id' | 'api_version';
type ScalarTouched = Partial<Record<ScalarField, boolean>>;

type OverviewTabProps = Readonly<{
  form: InstanceForm;
  setForm: React.Dispatch<React.SetStateAction<InstanceForm>>;
  catalogItems: CatalogItem[];
  onLoadMoreCatalogItems?: () => void;
  loadingMoreCatalogItems?: boolean;
  touched: ScalarTouched;
  setTouched: React.Dispatch<React.SetStateAction<ScalarTouched>>;
  submitAttempted: boolean;
}>;

function OverviewTab({
  form,
  setForm,
  catalogItems,
  onLoadMoreCatalogItems,
  loadingMoreCatalogItems,
  touched,
  setTouched,
  submitAttempted,
}: OverviewTabProps) {
  const classes = useStyles();
  const { t } = useTranslation();
  const errors = useMemo(() => validateInstanceForm(form, t), [form, t]);

  const handleCatalogItemChange = (id: string) => {
    const item = catalogItems.find(ci => ci.uid === id);
    setForm(prev => ({
      ...prev,
      catalog_item_id: id,
      resource_values: buildResourceUserValues(item),
    }));
    setTouched(prev => ({ ...prev, catalog_item_id: true }));
  };

  const showFieldError = (field: ScalarField) =>
    Boolean((touched[field] || submitAttempted) && errors[field]);

  const helperOrError = (field: ScalarField, helper: string) =>
    showFieldError(field) && errors[field] ? errors[field]! : helper;

  return (
    <Box display="flex" flexDirection="column" gridGap={20}>
      <TextField
        label={t('instances.form.displayNameLabel')}
        helperText={helperOrError(
          'display_name',
          t('instances.form.displayNameHelper'),
        )}
        error={showFieldError('display_name')}
        value={form.display_name}
        onChange={e => {
          setForm(prev => ({ ...prev, display_name: e.target.value }));
          setTouched(prev => ({ ...prev, display_name: true }));
        }}
        onBlur={() => setTouched(prev => ({ ...prev, display_name: true }))}
        fullWidth
        variant="outlined"
        size="small"
      />

      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        error={showFieldError('catalog_item_id')}
      >
        <InputLabel shrink>{t('instances.form.catalogItemLabel')}</InputLabel>
        <Select
          value={form.catalog_item_id}
          onChange={e => handleCatalogItemChange(e.target.value as string)}
          displayEmpty
          input={
            <OutlinedInput
              notched
              label={t('instances.form.catalogItemLabel')}
            />
          }
          MenuProps={{
            MenuListProps: {
              onScroll: (e: React.UIEvent<HTMLUListElement>) => {
                if (!onLoadMoreCatalogItems) return;
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
                  onLoadMoreCatalogItems();
                }
              },
            },
          }}
        >
          <MenuItem value="">
            <em>{t('instances.form.catalogItemSelect')}</em>
          </MenuItem>
          {catalogItems.map(ci => (
            <MenuItem key={ci.uid} value={ci.uid ?? ''}>
              {ci.display_name ?? ci.uid}
              {ci.spec?.resources && ci.spec.resources.length > 0 && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  className={classes.catalogItemBadge}
                >
                  ({ci.spec.resources.map(r => r.service_type).join(', ')})
                </Typography>
              )}
            </MenuItem>
          ))}
          {loadingMoreCatalogItems && (
            <MenuItem disabled>
              <CircularProgress size={14} style={{ marginRight: 8 }} />
              <Typography variant="caption" color="textSecondary">
                {t('common.loadingMore')}
              </Typography>
            </MenuItem>
          )}
        </Select>
        <FormHelperText>
          {(() => {
            if (showFieldError('catalog_item_id') && errors.catalog_item_id) {
              return errors.catalog_item_id;
            }
            return catalogItems.length === 0
              ? t('instances.form.catalogItemHelperNoItems')
              : t('instances.form.catalogItemHelperDefault');
          })()}
        </FormHelperText>
      </FormControl>

      <TextField
        label={t('instances.form.apiVersionLabel')}
        helperText={helperOrError(
          'api_version',
          t('instances.form.apiVersionHelper'),
        )}
        error={showFieldError('api_version')}
        value={form.api_version}
        onChange={e => {
          setForm(prev => ({ ...prev, api_version: e.target.value }));
          setTouched(prev => ({ ...prev, api_version: true }));
        }}
        onBlur={() => setTouched(prev => ({ ...prev, api_version: true }))}
        fullWidth
        variant="outlined"
        size="small"
      />
    </Box>
  );
}

// ─── Per-resource Values Tab ─────────────────────────────────────────────────

type ResourceValuesTabProps = Readonly<{
  resourceValues: ResourceUserValues;
  resourceIndex: number;
  setForm: React.Dispatch<React.SetStateAction<InstanceForm>>;
  submitAttempted: boolean;
}>;

function ResourceValuesTab({
  resourceValues,
  resourceIndex,
  setForm,
  submitAttempted,
}: ResourceValuesTabProps) {
  const { t } = useTranslation();
  const [touchedMap, setTouchedMap] = useState<Record<number, boolean>>({});
  const errors = useMemo(
    () => validateUserValues(resourceValues.values, t),
    [resourceValues.values, t],
  );
  const effectiveTouchedMap: Record<number, boolean> = submitAttempted
    ? Object.fromEntries(resourceValues.values.map((_, i) => [i, true]))
    : touchedMap;

  if (resourceValues.values.length === 0) {
    return (
      <Typography variant="caption" color="textSecondary">
        {t('instances.form.noEditableFields')}
      </Typography>
    );
  }

  const handleValueChange = (index: number, value: string) => {
    setForm(prev => {
      const updatedResourceValues = [...prev.resource_values];
      const updatedValues = [...updatedResourceValues[resourceIndex].values];
      updatedValues[index] = { ...updatedValues[index], value };
      updatedResourceValues[resourceIndex] = {
        ...updatedResourceValues[resourceIndex],
        values: updatedValues,
      };
      return { ...prev, resource_values: updatedResourceValues };
    });
  };

  const handleBlur = (index: number) => {
    setTouchedMap(prev => ({ ...prev, [index]: true }));
  };

  return (
    <UserValueFields
      rows={resourceValues.values}
      errors={errors}
      touchedMap={effectiveTouchedMap}
      onValueChange={handleValueChange}
      onBlur={handleBlur}
    />
  );
}

// ─── InstanceWizardDialog (main export) ─────────────────────────────────────

export type InstanceWizardDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  form: InstanceForm;
  setForm: React.Dispatch<React.SetStateAction<InstanceForm>>;
  catalogItems: CatalogItem[];
  /** Called when the user scrolls to the bottom of the catalog-item dropdown. */
  onLoadMoreCatalogItems?: () => void;
  loadingMoreCatalogItems?: boolean;
  onSubmit: () => void;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
}>;

export function InstanceWizardDialog({
  open,
  onClose,
  title,
  form,
  setForm,
  catalogItems,
  onLoadMoreCatalogItems,
  loadingMoreCatalogItems,
  onSubmit,
  submitLabel,
  submitting,
  error,
}: InstanceWizardDialogProps) {
  const { t } = useTranslation();

  /** Returns whether a given tab's content is currently valid. */
  const isTabCurrentlyValid = (tabIndex: number): boolean => {
    if (tabIndex === 0) {
      return Object.keys(validateInstanceForm(form)).length === 0;
    }
    const rv = form.resource_values[tabIndex - 1];
    if (!rv) return true;
    return Object.keys(validateUserValues(rv.values)).length === 0;
  };

  const {
    activeTab,
    setActiveTab,
    finalSubmitAttempted,
    touched,
    setTouched,
    tabSubmitAttempted,
    handleBeforeNext,
    handleClose: wizardHandleClose,
    markFinalSubmit,
  } = useWizardState<Record<ScalarField, boolean>>(open, isTabCurrentlyValid);

  const handleClose = () => wizardHandleClose(onClose);

  const handleSubmit = () => {
    markFinalSubmit();
    if (!isInstanceFormValid(form)) return;
    onSubmit();
  };

  const tabs = useMemo(() => {
    const overviewTab = {
      label: t('instances.wizard.tabOverview'),
      content: (
        <OverviewTab
          form={form}
          setForm={setForm}
          catalogItems={catalogItems}
          onLoadMoreCatalogItems={onLoadMoreCatalogItems}
          loadingMoreCatalogItems={loadingMoreCatalogItems}
          touched={touched}
          setTouched={setTouched}
          submitAttempted={tabSubmitAttempted(0)}
        />
      ),
    };

    const resourceTabs = form.resource_values.map((rv, i) => ({
      key: rv.resourceName,
      label: rv.resourceName,
      content: (
        <ResourceValuesTab
          resourceValues={rv}
          resourceIndex={i}
          setForm={setForm}
          submitAttempted={tabSubmitAttempted(1 + i)}
        />
      ),
    }));

    return [overviewTab, ...resourceTabs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form,
    setForm,
    catalogItems,
    onLoadMoreCatalogItems,
    loadingMoreCatalogItems,
    touched,
    tabSubmitAttempted,
    t,
  ]);

  return (
    <VerticalTabDialog
      open={open}
      onClose={handleClose}
      title={title}
      tabs={tabs}
      activeTab={Math.min(activeTab, tabs.length - 1)}
      onTabChange={setActiveTab}
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
      submitting={submitting}
      disabled={finalSubmitAttempted && !isInstanceFormValid(form)}
      error={error}
      onBeforeNext={handleBeforeNext}
    />
  );
}
