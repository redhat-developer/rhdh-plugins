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

import { useMemo } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import type { ServiceType } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import {
  AGENT_COST_OPTIONS,
  AgentForm,
  validateAgentForm,
} from '../agentFormTypes';
import { useTranslation } from '../../../hooks/useTranslation';

const useStyles = makeStyles(theme => ({
  placeholderText: {
    color:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(0,0,0,0.38)',
  },
  chipWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
  },
}));

type TouchedMap = Partial<Record<keyof AgentForm, boolean>>;

export type AgentFormFieldsProps = Readonly<{
  form: AgentForm;
  setForm: React.Dispatch<React.SetStateAction<AgentForm>>;
  touched: TouchedMap;
  setTouched: React.Dispatch<React.SetStateAction<TouchedMap>>;
  serviceTypes?: ServiceType[];
  loadingServiceTypes?: boolean;
  loadingMoreServiceTypes?: boolean;
  loadMoreServiceTypes?: () => void;
}>;

export function AgentFormFields({
  form,
  setForm,
  touched,
  setTouched,
  serviceTypes = [],
  loadingServiceTypes = false,
  loadingMoreServiceTypes = false,
  loadMoreServiceTypes,
}: AgentFormFieldsProps) {
  const classes = useStyles();
  const { t } = useTranslation();
  const errors = useMemo(() => validateAgentForm(form, t), [form, t]);

  const touch = (field: keyof AgentForm) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const err = (field: keyof AgentForm) =>
    touched[field] ? errors[field] : undefined;

  return (
    <Box display="flex" flexDirection="column" gridGap={16}>
      <TextField
        label={t('agents.form.nameLabel')}
        helperText={err('name') ?? t('agents.form.nameHelper')}
        error={Boolean(err('name'))}
        value={form.name}
        onChange={e => {
          const newName = e.target.value;
          setForm(prev => {
            const generated =
              prev.topic_name === '' ||
              prev.topic_name === `dcm.agent.${prev.name}`;
            return {
              ...prev,
              name: newName,
              ...(generated ? { topic_name: `dcm.agent.${newName}` } : {}),
            };
          });
        }}
        onBlur={() => touch('name')}
        fullWidth
        variant="outlined"
        size="small"
        placeholder={t('agents.form.namePlaceholder')}
      />

      <TextField
        label={t('agents.form.environmentLabel')}
        helperText={err('environment') ?? t('agents.form.environmentHelper')}
        error={Boolean(err('environment'))}
        value={form.environment}
        onChange={e =>
          setForm(prev => ({ ...prev, environment: e.target.value }))
        }
        onBlur={() => touch('environment')}
        fullWidth
        variant="outlined"
        size="small"
        placeholder={t('agents.form.environmentPlaceholder')}
      />

      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        error={Boolean(err('service_types'))}
      >
        <InputLabel shrink>{t('agents.form.serviceTypesLabel')}</InputLabel>
        <Select
          multiple
          value={form.service_types}
          label={t('agents.form.serviceTypesLabel')}
          input={
            <OutlinedInput notched label={t('agents.form.serviceTypesLabel')} />
          }
          onChange={e =>
            setForm(prev => ({
              ...prev,
              service_types: e.target.value as string[],
            }))
          }
          onBlur={() => touch('service_types')}
          renderValue={selected =>
            (selected as string[]).length === 0 ? (
              <em className={classes.placeholderText}>
                {t('agents.form.serviceTypesHelper')}
              </em>
            ) : (
              <Box className={classes.chipWrap}>
                {(selected as string[]).map(val => (
                  <Chip key={val} label={val} size="small" />
                ))}
              </Box>
            )
          }
          MenuProps={{
            MenuListProps: {
              onScroll: (e: React.UIEvent<HTMLUListElement>) => {
                const el = e.currentTarget;
                if (
                  el.scrollHeight - el.scrollTop <= el.clientHeight + 40 &&
                  loadMoreServiceTypes
                ) {
                  loadMoreServiceTypes();
                }
              },
            },
          }}
          displayEmpty
        >
          {serviceTypes.length === 0 &&
            !loadingServiceTypes &&
            !loadingMoreServiceTypes && (
              <MenuItem value="" disabled>
                <em>{t('agents.form.serviceTypesHelper')}</em>
              </MenuItem>
            )}
          {loadingServiceTypes && (
            <MenuItem disabled>
              <CircularProgress size={16} />
            </MenuItem>
          )}
          {serviceTypes.map(st => (
            <MenuItem key={st.service_type} value={st.service_type}>
              {st.service_type}
            </MenuItem>
          ))}
          {loadingMoreServiceTypes && (
            <MenuItem disabled>
              <CircularProgress size={16} />
            </MenuItem>
          )}
        </Select>
        <FormHelperText>
          {err('service_types') ?? t('agents.form.serviceTypesHelper')}
        </FormHelperText>
      </FormControl>

      <FormControl
        variant="outlined"
        size="small"
        fullWidth
        error={Boolean(err('cost'))}
      >
        <InputLabel shrink>{t('agents.form.costLabel')}</InputLabel>
        <Select
          value={form.cost}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              cost: e.target.value as AgentForm['cost'],
            }))
          }
          onBlur={() => touch('cost')}
          displayEmpty
          input={<OutlinedInput notched label={t('agents.form.costLabel')} />}
        >
          <MenuItem value="" disabled>
            <em>{t('agents.form.costHelper')}</em>
          </MenuItem>
          {AGENT_COST_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {err('cost') ?? t('agents.form.costHelper')}
        </FormHelperText>
      </FormControl>

      <TextField
        label={t('agents.form.topicNameLabel')}
        helperText={err('topic_name') ?? t('agents.form.topicNameHelper')}
        error={Boolean(err('topic_name'))}
        value={form.topic_name}
        onChange={e =>
          setForm(prev => ({ ...prev, topic_name: e.target.value }))
        }
        onBlur={() => touch('topic_name')}
        fullWidth
        variant="outlined"
        size="small"
        placeholder={t('agents.form.topicNamePlaceholder')}
      />
    </Box>
  );
}
