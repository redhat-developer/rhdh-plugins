/*
 * Copyright 2024 The Backstage Authors
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
import {
  IntrospectionField,
  TypeKind,
  TypeName,
} from '@redhat/backstage-plugin-orchestrator-common';

export const mockProcessDefinitionArguments = {
  __type: {
    kind: 'INPUT_OBJECT',
    name: 'ProcessDefinitionArgument',
    inputFields: [
      {
        name: 'and',
        type: {
          kind: 'LIST',
          name: null,
          ofType: {
            kind: 'NON_NULL',
            name: null,
            ofType: {
              kind: 'INPUT_OBJECT',
              name: 'ProcessDefinitionArgument',
              ofType: null,
            },
          },
        },
      },
      {
        name: 'or',
        type: {
          kind: 'LIST',
          name: null,
          ofType: {
            kind: 'NON_NULL',
            name: null,
            ofType: {
              kind: 'INPUT_OBJECT',
              name: 'ProcessDefinitionArgument',
              ofType: null,
            },
          },
        },
      },
      {
        name: 'not',
        type: {
          kind: 'INPUT_OBJECT',
          name: 'ProcessDefinitionArgument',
          ofType: null,
        },
      },
      {
        name: 'id',
        type: {
          kind: 'INPUT_OBJECT',
          name: 'StringArgument',
          ofType: null,
        },
      },
      {
        name: 'name',
        type: {
          kind: 'INPUT_OBJECT',
          name: 'StringArgument',
          ofType: null,
        },
      },
      {
        name: 'version',
        type: {
          kind: 'INPUT_OBJECT',
          name: 'StringArgument',
          ofType: null,
        },
      },
    ],
  },
};

export const mockProcessDefinitionIntrospection: IntrospectionField[] = [
  {
    name: 'id',
    type: {
      kind: TypeKind.InputObject,
      name: TypeName.String,
      ofType: null,
    },
  },
  {
    name: 'name',
    type: {
      kind: TypeKind.InputObject,
      name: TypeName.String,
      ofType: null,
    },
  },
  {
    name: 'version',
    type: {
      kind: TypeKind.InputObject,
      name: TypeName.String,
      ofType: null,
    },
  },
];
