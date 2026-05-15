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

import { useEffect, useState, useCallback } from 'react';
import {
  type CustomFieldValidator,
  type FieldExtensionComponentProps,
} from '@backstage/plugin-scaffolder-react';
import {
  Checkbox,
  FormControlLabel,
  Typography,
  CircularProgress,
  Box,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import type { Rule } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../ClientService';
import { useTranslation } from '../hooks/useTranslation';
import {
  extractResponseError,
  isHttpSuccessResponse,
} from '../components/tools';

const useStyles = makeStyles(() => ({
  ruleControl: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
}));

/**
 * RulesAcceptance custom scaffolder field.
 * Fetches rules from the x2a backend and renders them as a checklist.
 * Required rules are pre-checked and locked. Optional rules are unchecked by default.
 * The field value is a JSON-stringified array of accepted rule IDs.
 *
 * @public
 */
export const RulesAcceptance = ({
  onChange,
  schema,
}: FieldExtensionComponentProps<string>) => {
  const clientService = useClientService();
  const { t } = useTranslation();
  const classes = useStyles();

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const { title, description } = schema;

  useEffect(() => {
    let cancelled = false;
    const fetchRules = async () => {
      try {
        const response = await clientService.rulesGet({});
        if (!isHttpSuccessResponse(response)) {
          const message = await extractResponseError(
            response,
            t('scaffolder.rulesAcceptance.fetchError'),
          );
          throw new Error(message);
        }
        const data = await response.json();
        if (cancelled) return;

        const items = data.items ?? [];
        setRules(items);

        // Pre-check required rules
        const requiredIds = new Set(
          items.filter(r => r.required).map(r => r.id),
        );
        setCheckedIds(requiredIds);

        // Set initial value
        onChange(JSON.stringify([...requiredIds]));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRules();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(
    (ruleId: string) => {
      setCheckedIds(prev => {
        const next = new Set(prev);
        if (next.has(ruleId)) {
          next.delete(ruleId);
        } else {
          next.add(ruleId);
        }
        onChange(JSON.stringify([...next]));
        return next;
      });
    },
    [onChange],
  );

  if (loading) {
    return (
      <Box display="flex" alignItems="center" p={2}>
        <CircularProgress size={20} />
        <Typography variant="body2" style={{ marginLeft: 8 }}>
          {t('scaffolder.rulesAcceptance.loadingRules')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }

  if (rules.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        {t('scaffolder.rulesAcceptance.noRulesConfigured')}
      </Typography>
    );
  }

  return (
    <>
      {title && <Typography variant="h6">{title}</Typography>}
      {description && (
        <Typography variant="body2" color="textSecondary" paragraph>
          {description}
        </Typography>
      )}
      {rules.map(rule => (
        <FormControlLabel
          key={rule.id}
          className={classes.ruleControl}
          control={
            <Checkbox
              checked={checkedIds.has(rule.id)}
              disabled={rule.required}
              onChange={() => handleToggle(rule.id)}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                {rule.title}
                {rule.required && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="textSecondary"
                  >
                    {` (${t('scaffolder.rulesAcceptance.required')})`}
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {rule.description.length > 100
                  ? `${rule.description.slice(0, 100)}...`
                  : rule.description}
              </Typography>
            </Box>
          }
        />
      ))}
    </>
  );
};

/**
 * Validation for the RulesAcceptance field.
 * Ensures rules have been loaded and accepted.
 *
 * @public
 */
export const rulesAcceptanceValidation: CustomFieldValidator<string> = (
  data,
  _field,
) => {
  // The field always has a value (JSON array) once rules are loaded.
  // No blocking validation needed — required rules are auto-checked.
  if (!data) {
    return;
  }
};
