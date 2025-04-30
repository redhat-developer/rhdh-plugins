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
import React, { useEffect, useMemo, useState } from 'react';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { JsonObject } from '@backstage/types';
import { makeStyles, Theme } from '@material-ui/core';
import {
  useWrapperFormPropsContext,
  SchemaChunksResponse,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { fetchApiRef, useApi } from '@backstage/core-plugin-api';

import { FormContextData } from '../types';
import {
  evaluateTemplate,
  getRequestInit,
  useRetriggerEvaluate,
  useTemplateUnitEvaluator,
} from '../utils';
import { isEqual } from 'lodash';

const useStyles = makeStyles((theme: Theme) => ({
  error: {
    color: theme.palette.error.main,
  },
}));

export const SchemaUpdater: Widget<
  JsonObject,
  JSONSchema7,
  FormContextData
> = props => {
  const fetchApi = useApi(fetchApiRef);
  const templateUnitEvaluator = useTemplateUnitEvaluator();

  const classes = useStyles();
  const formContext = useWrapperFormPropsContext();
  const [_, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [evaluatedFetchUrl, setEvaluatedFetchUrl] = useState<string>();
  const [evaluatedRequestInit, setEvaluatedRequestInit] =
    useState<RequestInit>();

  const { updateSchema, formData } = formContext;

  const uiProps = useMemo(
    () => (props.options?.props ?? {}) as JsonObject,
    [props.options?.props],
  );
  const fetchUrl = uiProps['fetch:url']?.toString();

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  useEffect(() => {
    evaluateTemplate({
      template: fetchUrl,
      key: 'fetch:url',
      unitEvaluator: templateUnitEvaluator,
      formData,
    })
      .then(evaluated => setEvaluatedFetchUrl(evaluated))
      .catch(reason => setError(reason.toString()));
  }, [fetchUrl, templateUnitEvaluator, formData]);

  useEffect(() => {
    getRequestInit(uiProps, 'fetch', templateUnitEvaluator, formData)
      .then(evaluated =>
        setEvaluatedRequestInit(actual =>
          isEqual(actual, evaluated) ? actual : evaluated,
        ),
      )
      .catch(reason => setError(reason.toString()));
  }, [uiProps, templateUnitEvaluator, formData]);

  useEffect(() => {
    const fetchSchemaChunks = async () => {
      if (!evaluatedFetchUrl || !retrigger || !evaluatedRequestInit) {
        return;
      }

      try {
        setLoading(true);
        setError(undefined);

        const response = await fetchApi.fetch(
          evaluatedFetchUrl,
          evaluatedRequestInit,
        );
        const data = (await response.json()) as unknown as SchemaChunksResponse;

        // validate received response before updating
        if (!data) {
          throw new Error('Empty response received');
        }
        if (typeof data !== 'object') {
          throw new Error('JSON object expected');
        }
        Object.keys(data).forEach(key => {
          if (!data[key].type) {
            throw new Error(
              `JSON response malformed, missing "type" field for "${key}" key`,
            );
          }
        });

        updateSchema(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          'Error when updating schema',
          props.id,
          evaluatedFetchUrl,
          err,
        );
        setError(
          `Failed to fetch schema update by the ${props.id} SchemaUpdater`,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchemaChunks();
  }, [
    evaluatedFetchUrl,
    evaluatedRequestInit,
    fetchApi,
    props.id,
    updateSchema,
    // no need to expand the "retrigger" array here since its identity changes only if an item changes
    retrigger,
  ]);

  if (!fetchUrl) {
    // eslint-disable-next-line no-console
    console.warn(
      'SchemaUpdater, incorrect ui:props, missing url:fetch: ',
      props.id,
      props.schema,
    );
    return <div>Misconfigured SchemaUpdater</div>;
  }

  if (error) {
    return <div className={classes.error}>{error}</div>;
  }

  // No need to render anything
  return <></>;
};
