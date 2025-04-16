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
import React, { useEffect, useState } from 'react';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { JsonObject } from '@backstage/types';
import { makeStyles, Theme } from '@material-ui/core';
import {
  OrchestratorFormSchemaUpdater,
  useWrapperFormPropsContext,
  SchemaChunksResponse,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

import { FormContextData } from '../types';

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
  const classes = useStyles();
  const formContext = useWrapperFormPropsContext();
  const [_, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const updateSchema =
    formContext.updateSchema as OrchestratorFormSchemaUpdater;
  const uiProps = (props.options?.props ?? {}) as JsonObject;

  const fetchUrl = uiProps['fetch:url']?.toString();

  useEffect(() => {
    const fetchSchemaChunks = async () => {
      if (!fetchUrl) {
        return;
      }

      try {
        setLoading(true);
        setError(undefined);

        // TODO: use Backstage fetchApi instead
        const response = await fetch(fetchUrl);
        const data = (await response.json()) as unknown as SchemaChunksResponse;

        // TODO: validate received response before updating

        updateSchema(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error when updating schema', props.id, fetchUrl, err);
        setError(
          `Failed to fetch schema update by the ${props.id} SchemaUpdater`,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchemaChunks();
  }, [fetchUrl, props.id, updateSchema /* TODO: when to retrigger? */]);

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
    // TODO: Maybe render such errors on top of the page
    return <div className={classes.error}>{error}</div>;
  }

  // No need to render anything
  return <></>;
};
