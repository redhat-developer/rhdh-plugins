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

import { useRef, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MuiAlert from '@material-ui/lab/Alert';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import PublishIcon from '@material-ui/icons/Publish';
import { load as loadYaml } from 'js-yaml';
import type { ServiceType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { VerticalTabDialog } from '../../../components/VerticalTabDialog';
import { useTranslation } from '../../../hooks/useTranslation';
import { useWizardState } from '../../../hooks/useWizardState';
import {
  emptyResourceFormEntry,
  hasValidFields,
  isCatalogItemFormValid,
  validateCatalogItemForm,
  validateFieldRows,
  validateResourceEntry,
  catalogItemFromPayload,
} from '../catalogItemFormTypes';
import type {
  CatalogItemForm,
  ResourceFormEntry,
  ResourceFormErrors,
} from '../catalogItemFormTypes';
import { ResourceFieldsPanel } from './ResourceFieldsPanel';

const useStyles = makeStyles(theme => ({
  overviewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  resourceCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  resourceCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addResourceBtn: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing(1),
  },
  importButton: {
    alignSelf: 'flex-end',
  },
  requiresChip: {
    margin: theme.spacing(0.25),
    height: 24,
    fontSize: theme.typography.pxToRem(12),
  },
}));

function serviceTypeHelperText(
  isEditMode: boolean,
  count: number,
  t: (key: string) => string,
): string {
  if (isEditMode) return t('catalogItems.form.serviceTypeHelperEdit');
  if (count === 0) return t('catalogItems.form.serviceTypeHelperNoTypes');
  return t('catalogItems.form.serviceTypeHelperDefault');
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

type OverviewTabProps = Readonly<{
  form: CatalogItemForm;
  setForm: React.Dispatch<React.SetStateAction<CatalogItemForm>>;
  touched: Partial<Record<'display_name' | 'api_version', boolean>>;
  setTouched: React.Dispatch<
    React.SetStateAction<
      Partial<Record<'display_name' | 'api_version', boolean>>
    >
  >;
  submitAttempted: boolean;
}>;

function OverviewTab({
  form,
  setForm,
  touched,
  setTouched,
  submitAttempted,
}: OverviewTabProps) {
  const classes = useStyles();
  const { t } = useTranslation();
  const errors = useMemo(() => validateCatalogItemForm(form, t), [form, t]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isYaml = file.name.endsWith('.yaml') || file.name.endsWith('.yml');
    file
      .text()
      .then(text => {
        const parsed = isYaml ? loadYaml(text) : JSON.parse(text);
        setForm(catalogItemFromPayload(parsed));
        setTouched({});
        setImportError('');
      })
      .catch(() => {
        setImportError(t('catalogItems.form.importError'));
      });
    e.target.value = '';
  };

  return (
    <Box className={classes.overviewSection}>
      <Box display="flex" justifyContent="flex-end">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          hidden
          onChange={handleImportFile}
        />
        <Tooltip title={t('catalogItems.form.importTooltip')}>
          <Button
            size="small"
            startIcon={<PublishIcon />}
            onClick={() => fileInputRef.current?.click()}
            className={classes.importButton}
          >
            {t('catalogItems.form.importButton')}
          </Button>
        </Tooltip>
      </Box>

      {importError && (
        <MuiAlert
          severity="error"
          variant="outlined"
          onClose={() => setImportError('')}
        >
          {importError}
        </MuiAlert>
      )}

      <TextField
        label={t('catalogItems.form.displayNameLabel')}
        helperText={
          (touched.display_name || submitAttempted) && errors.display_name
            ? errors.display_name
            : t('catalogItems.form.displayNameHelper')
        }
        error={Boolean(
          (touched.display_name || submitAttempted) && errors.display_name,
        )}
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
    </Box>
  );
}

// ─── API Tab ──────────────────────────────────────────────────────────────────

type ApiTabProps = Readonly<{
  form: CatalogItemForm;
  setForm: React.Dispatch<React.SetStateAction<CatalogItemForm>>;
  touched: Partial<Record<'display_name' | 'api_version', boolean>>;
  setTouched: React.Dispatch<
    React.SetStateAction<
      Partial<Record<'display_name' | 'api_version', boolean>>
    >
  >;
  submitAttempted: boolean;
  isEditMode: boolean;
}>;

function ApiTab({
  form,
  setForm,
  touched,
  setTouched,
  submitAttempted,
  isEditMode,
}: ApiTabProps) {
  const { t } = useTranslation();
  const errors = useMemo(() => validateCatalogItemForm(form, t), [form, t]);

  return (
    <TextField
      label={t('catalogItems.form.apiVersionLabel')}
      helperText={(() => {
        if (isEditMode) {
          return t('catalogItems.wizard.apiVersionImmutable');
        }
        if ((touched.api_version || submitAttempted) && errors.api_version) {
          return errors.api_version;
        }
        return t('catalogItems.form.apiVersionHelper');
      })()}
      error={
        !isEditMode &&
        Boolean((touched.api_version || submitAttempted) && errors.api_version)
      }
      value={form.api_version}
      onChange={e => {
        setForm(prev => ({ ...prev, api_version: e.target.value }));
        setTouched(prev => ({ ...prev, api_version: true }));
      }}
      onBlur={() => setTouched(prev => ({ ...prev, api_version: true }))}
      fullWidth
      variant="outlined"
      size="small"
      disabled={isEditMode}
    />
  );
}

// ─── Resources Tab ────────────────────────────────────────────────────────────

type ResourcesTabProps = Readonly<{
  form: CatalogItemForm;
  setForm: React.Dispatch<React.SetStateAction<CatalogItemForm>>;
  serviceTypes: ServiceType[];
  onLoadMoreServiceTypes?: () => void;
  loadingMoreServiceTypes?: boolean;
  submitAttempted: boolean;
  isEditMode: boolean;
}>;

function ResourcesTab({
  form,
  setForm,
  serviceTypes,
  onLoadMoreServiceTypes,
  loadingMoreServiceTypes,
  submitAttempted,
  isEditMode,
}: ResourcesTabProps) {
  const classes = useStyles();
  const { t } = useTranslation();

  const allNames = form.resources.map(r => r.name.trim());

  const updateResource = (index: number, patch: Partial<ResourceFormEntry>) => {
    setForm(prev => {
      const updated = [...prev.resources];
      const oldName = updated[index].name.trim();
      updated[index] = { ...updated[index], ...patch };
      const newName = patch.name !== undefined ? patch.name.trim() : oldName;
      if (oldName && newName !== oldName) {
        return {
          ...prev,
          resources: updated.map(r => ({
            ...r,
            requires_resources: r.requires_resources.map(dep =>
              dep === oldName ? newName : dep,
            ),
          })),
        };
      }
      return { ...prev, resources: updated };
    });
  };

  const removeResource = (index: number) => {
    setForm(prev => {
      const removedName = prev.resources[index]?.name.trim();
      const remaining = prev.resources.filter((_, i) => i !== index);
      if (!removedName) return { ...prev, resources: remaining };
      return {
        ...prev,
        resources: remaining.map(r => ({
          ...r,
          requires_resources: r.requires_resources.filter(
            dep => dep !== removedName,
          ),
        })),
      };
    });
  };

  const addResource = () => {
    setForm(prev => ({
      ...prev,
      resources: [...prev.resources, emptyResourceFormEntry()],
    }));
  };

  const showResourcesRequired = submitAttempted && form.resources.length === 0;

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <Typography variant="body2" color="textSecondary">
        {t('catalogItems.wizard.resourcesDescription')}
      </Typography>

      {showResourcesRequired && (
        <MuiAlert severity="error" variant="outlined">
          {t('catalogItems.wizard.resourcesRequired')}
        </MuiAlert>
      )}

      {form.resources.map((resource, i) => {
        const entryErrors: ResourceFormErrors = submitAttempted
          ? validateResourceEntry(resource, allNames, form.resources, t)
          : {};

        return (
          <Box key={resource.id} className={classes.resourceCard}>
            <Box className={classes.resourceCardHeader}>
              <Typography variant="subtitle2">
                {resource.name || t('catalogItems.wizard.unnamedResource')}
              </Typography>
              {!isEditMode && (
                <IconButton
                  size="small"
                  aria-label={t('catalogItems.wizard.removeResource')}
                  onClick={() => removeResource(i)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <TextField
              label={t('catalogItems.wizard.resourceNameLabel')}
              helperText={
                entryErrors.name ?? t('catalogItems.wizard.resourceNameHelper')
              }
              error={Boolean(entryErrors.name)}
              value={resource.name}
              onChange={e => updateResource(i, { name: e.target.value })}
              fullWidth
              variant="outlined"
              size="small"
              disabled={isEditMode}
            />

            <FormControl
              variant="outlined"
              size="small"
              fullWidth
              disabled={isEditMode}
              error={Boolean(entryErrors.service_type)}
            >
              <InputLabel shrink>
                {t('catalogItems.form.serviceTypeLabel')}
              </InputLabel>
              <Select
                value={resource.service_type}
                onChange={e =>
                  updateResource(i, {
                    service_type: e.target.value as string,
                  })
                }
                displayEmpty
                input={
                  <OutlinedInput
                    notched
                    label={t('catalogItems.form.serviceTypeLabel')}
                  />
                }
                MenuProps={{
                  MenuListProps: {
                    onScroll: (e: React.UIEvent<HTMLUListElement>) => {
                      if (!onLoadMoreServiceTypes) return;
                      const el = e.currentTarget;
                      if (
                        el.scrollTop + el.clientHeight >=
                        el.scrollHeight - 8
                      ) {
                        onLoadMoreServiceTypes();
                      }
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {serviceTypes.map(st => (
                  <MenuItem
                    key={st.uid ?? st.service_type}
                    value={st.service_type}
                  >
                    {st.service_type}
                  </MenuItem>
                ))}
                {loadingMoreServiceTypes && (
                  <MenuItem disabled>
                    <CircularProgress size={14} style={{ marginRight: 8 }} />
                    <Typography variant="caption" color="textSecondary">
                      {t('common.loadingMore')}
                    </Typography>
                  </MenuItem>
                )}
              </Select>
              <FormHelperText>
                {entryErrors.service_type ??
                  serviceTypeHelperText(isEditMode, serviceTypes.length, t)}
              </FormHelperText>
            </FormControl>

            {!isEditMode && form.resources.length > 1 && (
              <FormControl
                variant="outlined"
                size="small"
                fullWidth
                error={Boolean(entryErrors.requires_resources)}
              >
                <InputLabel shrink>
                  {t('catalogItems.wizard.requiresResourcesLabel')}
                </InputLabel>
                <Select
                  multiple
                  value={resource.requires_resources}
                  onChange={e =>
                    updateResource(i, {
                      requires_resources: e.target.value as string[],
                    })
                  }
                  input={
                    <OutlinedInput
                      notched
                      label={t('catalogItems.wizard.requiresResourcesLabel')}
                    />
                  }
                  renderValue={(selected: unknown) => (
                    <Box display="flex" flexWrap="wrap">
                      {(selected as string[]).map(v => (
                        <Chip
                          key={v}
                          label={v}
                          size="small"
                          className={classes.requiresChip}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {form.resources
                    .filter(
                      (_, ri) => ri !== i && form.resources[ri].name.trim(),
                    )
                    .map(r => (
                      <MenuItem key={r.id} value={r.name.trim()}>
                        {r.name.trim()}
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText>
                  {entryErrors.requires_resources ??
                    t('catalogItems.wizard.requiresResourcesHelper')}
                </FormHelperText>
              </FormControl>
            )}

            {isEditMode && resource.requires_resources.length > 0 && (
              <Box>
                <Typography variant="caption" color="textSecondary">
                  {t('catalogItems.wizard.requiresResourcesLabel')}:{' '}
                  {resource.requires_resources.join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}

      {!isEditMode && (
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addResource}
          className={classes.addResourceBtn}
          color="primary"
          variant="outlined"
        >
          {t('catalogItems.wizard.addResourceButton')}
        </Button>
      )}
    </Box>
  );
}

// ─── Per-resource Fields Tab ─────────────────────────────────────────────────

type ResourceFieldsTabProps = Readonly<{
  resourceIndex: number;
  form: CatalogItemForm;
  setForm: React.Dispatch<React.SetStateAction<CatalogItemForm>>;
  submitAttempted: boolean;
}>;

function ResourceFieldsTab({
  resourceIndex,
  form,
  setForm,
  submitAttempted,
}: ResourceFieldsTabProps) {
  const resource = form.resources[resourceIndex];
  if (!resource) return null;

  return (
    <ResourceFieldsPanel
      fields={resource.fields}
      onChange={updated => {
        setForm(prev => {
          const updatedResources = [...prev.resources];
          updatedResources[resourceIndex] = {
            ...updatedResources[resourceIndex],
            fields: updated,
          };
          return { ...prev, resources: updatedResources };
        });
      }}
      submitAttempted={submitAttempted}
    />
  );
}

// ─── CatalogItemWizardDialog (main export) ─────────────────────────────────

export type CatalogItemWizardDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  form: CatalogItemForm;
  setForm: React.Dispatch<React.SetStateAction<CatalogItemForm>>;
  serviceTypes: ServiceType[];
  /** Called when the user scrolls to the bottom of a service-type dropdown. */
  onLoadMoreServiceTypes?: () => void;
  loadingMoreServiceTypes?: boolean;
  onSubmit: () => void;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  isEditMode: boolean;
}>;

export function CatalogItemWizardDialog({
  open,
  onClose,
  title,
  form,
  setForm,
  serviceTypes,
  onLoadMoreServiceTypes,
  loadingMoreServiceTypes,
  onSubmit,
  submitLabel,
  submitting,
  error,
  isEditMode,
}: CatalogItemWizardDialogProps) {
  const { t } = useTranslation();

  /** Returns whether a given tab's content is currently valid. */
  const isTabCurrentlyValid = (tabIndex: number): boolean => {
    const scalarErrors = validateCatalogItemForm(form);
    switch (tabIndex) {
      case 0:
        return !scalarErrors.display_name;
      case 1:
        return isEditMode || !scalarErrors.api_version;
      case 2: {
        if (form.resources.length === 0) return false;
        const allNames = form.resources.map(r => r.name.trim());
        return form.resources.every(
          r =>
            Object.keys(validateResourceEntry(r, allNames, form.resources))
              .length === 0,
        );
      }
      default: {
        const resourceIndex = tabIndex - 3;
        const resource = form.resources[resourceIndex];
        if (!resource) return true;
        return (
          hasValidFields(resource.fields) &&
          Object.keys(validateFieldRows(resource.fields)).length === 0
        );
      }
    }
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
  } = useWizardState<Record<'display_name' | 'api_version', boolean>>(
    open,
    isTabCurrentlyValid,
  );

  const handleClose = () => wizardHandleClose(onClose);

  const handleSubmit = () => {
    markFinalSubmit();
    if (!isCatalogItemFormValid(form)) return;
    onSubmit();
  };

  const tabs = useMemo(() => {
    const staticTabs = [
      {
        label: t('catalogItems.wizard.tabOverview'),
        content: (
          <OverviewTab
            form={form}
            setForm={setForm}
            touched={touched}
            setTouched={setTouched}
            submitAttempted={tabSubmitAttempted(0)}
          />
        ),
      },
      {
        label: t('catalogItems.wizard.tabApi'),
        content: (
          <ApiTab
            form={form}
            setForm={setForm}
            touched={touched}
            setTouched={setTouched}
            submitAttempted={tabSubmitAttempted(1)}
            isEditMode={isEditMode}
          />
        ),
      },
      {
        label: t('catalogItems.wizard.tabResources'),
        content: (
          <ResourcesTab
            form={form}
            setForm={setForm}
            serviceTypes={serviceTypes}
            onLoadMoreServiceTypes={onLoadMoreServiceTypes}
            loadingMoreServiceTypes={loadingMoreServiceTypes}
            submitAttempted={tabSubmitAttempted(2)}
            isEditMode={isEditMode}
          />
        ),
      },
    ];

    const resourceTabs = form.resources.map((r, i) => ({
      key: r.id,
      label: r.name || t('catalogItems.wizard.unnamedResource'),
      content: (
        <ResourceFieldsTab
          resourceIndex={i}
          form={form}
          setForm={setForm}
          submitAttempted={tabSubmitAttempted(3 + i)}
        />
      ),
    }));

    return [...staticTabs, ...resourceTabs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form,
    setForm,
    serviceTypes,
    onLoadMoreServiceTypes,
    loadingMoreServiceTypes,
    isEditMode,
    tabSubmitAttempted,
    touched,
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
      disabled={finalSubmitAttempted && !isCatalogItemFormValid(form)}
      error={error}
      onBeforeNext={handleBeforeNext}
    />
  );
}
