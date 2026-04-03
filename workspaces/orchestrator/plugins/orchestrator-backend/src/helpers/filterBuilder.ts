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

import {
  FieldFilter,
  FieldFilterOperatorEnum,
  Filter,
  IntrospectionField,
  LogicalFilter,
  NestedFilter,
  TypeName,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { randomBytes } from 'node:crypto';

import { FilterClause, FilterClauseVariable } from '../types/filterClause';

type ProcessType = 'ProcessDefinition' | 'ProcessInstance';

const supportedOperators = [
  FieldFilterOperatorEnum.Eq,
  FieldFilterOperatorEnum.Like,
  FieldFilterOperatorEnum.In,
  FieldFilterOperatorEnum.IsNull,
  FieldFilterOperatorEnum.Gt,
  FieldFilterOperatorEnum.Gte,
  FieldFilterOperatorEnum.Lt,
  FieldFilterOperatorEnum.Lte,
  FieldFilterOperatorEnum.Between,
];

const supportedOperatorsByType: Record<TypeName, FieldFilterOperatorEnum[]> = {
  [TypeName.String]: [
    FieldFilterOperatorEnum.In,
    FieldFilterOperatorEnum.Like,
    FieldFilterOperatorEnum.IsNull,
    FieldFilterOperatorEnum.Eq,
  ],
  [TypeName.Id]: [
    FieldFilterOperatorEnum.In,
    FieldFilterOperatorEnum.IsNull,
    FieldFilterOperatorEnum.Eq,
  ],
  [TypeName.Date]: [
    FieldFilterOperatorEnum.IsNull,
    FieldFilterOperatorEnum.Eq,
    FieldFilterOperatorEnum.Gt,
    FieldFilterOperatorEnum.Gte,
    FieldFilterOperatorEnum.Lt,
    FieldFilterOperatorEnum.Lte,
    FieldFilterOperatorEnum.Between,
  ],
};

function isLogicalFilter(filter: Filter): filter is LogicalFilter {
  return (filter as LogicalFilter).filters !== undefined;
}

function isNestedFilter(filter: Filter): filter is NestedFilter {
  return (filter as NestedFilter).nested !== undefined;
}

function handleLogicalFilter(
  introspection: IntrospectionField[],
  type: ProcessType,
  filter: LogicalFilter,
): FilterClause {
  if (!filter.operator) return {} as FilterClause;

  const subClauses = filter.filters.map(f =>
    buildFilterCondition(introspection, type, f),
  );

  const filterClause: FilterClause = {
    clause: `${filter.operator.toLowerCase()}: {${subClauses.map(cl => cl.clause).join(', ')}}`,
    clauseVariable: subClauses.flatMap(cl => cl.clauseVariable),
  };
  return filterClause;
}

function handleNestedFilter(
  introspection: IntrospectionField[],
  type: ProcessType,
  filter: NestedFilter,
): FilterClause {
  const subClauses = buildFilterCondition(
    introspection,
    type,
    filter.nested,
    true,
  );

  const filterClause: FilterClause = {
    clauseVariable: subClauses.clauseVariable,
    clause: `${filter.field}: {${subClauses.clause}}`,
  };

  return filterClause;
}

function handleBetweenOperator(filter: FieldFilter): FilterClause {
  if (!Array.isArray(filter.value) || filter.value.length !== 2) {
    throw new Error('Between operator requires an array of two elements');
  }
  const filterClauseVariableArray: FilterClauseVariable[] = [];
  const clauseVariableName1 = `clauseVariable${nonSecureRandomAlphaNumeric()}`;
  const filterClauseVariable1: FilterClauseVariable = {
    clauseVariableName: clauseVariableName1,
    formattedValue: filter.value[0],
    clauseVariableType: 'String',
  };

  const clauseVariableName2 = `clauseVariable${nonSecureRandomAlphaNumeric()}`;
  const filterClauseVariable2: FilterClauseVariable = {
    clauseVariableName: clauseVariableName2,
    formattedValue: filter.value[1],
    clauseVariableType: 'String',
  };

  const clause = `${filter.field}: {${getGraphQLOperator(
    FieldFilterOperatorEnum.Between,
  )}: {from: $${clauseVariableName1}, to: $${clauseVariableName2}}}`;
  filterClauseVariableArray.push(filterClauseVariable1, filterClauseVariable2);
  const filterClause: FilterClause = {
    clause: clause,
    clauseVariable: filterClauseVariableArray,
  };

  return filterClause;
}

function handleIsNullOperator(filter: FieldFilter): FilterClause {
  const clauseVariableName = `clauseVariable${nonSecureRandomAlphaNumeric()}`;
  const clause = `${filter.field}: {${getGraphQLOperator(FieldFilterOperatorEnum.IsNull)}: $${clauseVariableName}}`;

  const filterClauseVariable: FilterClauseVariable = {
    clauseVariableName: clauseVariableName,
    formattedValue: convertToBoolean(filter.value),
    clauseVariableType: 'Boolean',
  };
  const filterClauseVariableArray: FilterClauseVariable[] = [];
  filterClauseVariableArray.push(filterClauseVariable);
  const clauseObject: FilterClause = {
    clauseVariable: filterClauseVariableArray,
    clause,
  };

  return clauseObject;
}

function isEnumFilter(
  fieldName: string,
  type: 'ProcessDefinition' | 'ProcessInstance',
): boolean {
  if (type === 'ProcessInstance') {
    if (fieldName === 'state') {
      return true;
    }
  }
  return false;
}

function isValidEnumOperator(operator: FieldFilterOperatorEnum): boolean {
  return (
    operator === FieldFilterOperatorEnum.In ||
    operator === FieldFilterOperatorEnum.Eq
  );
}

function handleBinaryOperator(
  binaryFilter: FieldFilter,
  fieldDef: IntrospectionField | undefined,
  type: 'ProcessDefinition' | 'ProcessInstance',
): FilterClause {
  if (isEnumFilter(binaryFilter.field, type)) {
    if (!isValidEnumOperator(binaryFilter.operator)) {
      throw new Error(
        `Invalid operator ${binaryFilter.operator} for enum field ${binaryFilter.field} filter`,
      );
    }
  }
  let formattedValue: any;
  let paramType: string;
  if (Array.isArray(binaryFilter.value)) {
    formattedValue = binaryFilter.value.map(v =>
      formatValue(binaryFilter.field, v, fieldDef, type),
    );
    paramType = '[String!]';
  } else {
    formattedValue = formatValue(
      binaryFilter.field,
      binaryFilter.value,
      fieldDef,
      type,
    );
    paramType = 'String';
  }

  const clauseVariableName = `clauseVariable${nonSecureRandomAlphaNumeric()}`;
  const clause = `${binaryFilter.field}: {${getGraphQLOperator(binaryFilter.operator)}: $${clauseVariableName}}`;
  const filterClauseVariable: FilterClauseVariable = {
    clauseVariableName: clauseVariableName,
    formattedValue: formattedValue,
    clauseVariableType: paramType,
  };
  const filterClauseVariableArray: FilterClauseVariable[] = [];
  filterClauseVariableArray.push(filterClauseVariable);
  const clauseObject: FilterClause = {
    clauseVariable: filterClauseVariableArray,
    clause,
  };

  return clauseObject;
}

export function buildFilterCondition(
  introspection: IntrospectionField[],
  type: ProcessType,
  filters?: Filter,
  isNested?: boolean,
): FilterClause {
  if (!filters) {
    return {} as FilterClause;
  }

  if (isNestedFilter(filters)) {
    return handleNestedFilter(introspection, type, filters);
  }

  if (isLogicalFilter(filters)) {
    return handleLogicalFilter(introspection, type, filters);
  }

  if (!isOperatorSupported(filters.operator)) {
    throw new Error(
      `Unsupported operator ${filters.operator}. Supported operators are: ${supportedOperators.join(', ')}`,
    );
  }

  let fieldDef;

  if (!isNested) {
    fieldDef = introspection.find(f => f.name === filters.field);
    if (!fieldDef) {
      throw new Error(`Can't find field "${filters.field}" definition`);
    }

    if (!isOperatorAllowedForField(filters.operator, fieldDef, type)) {
      const allowedOperators =
        supportedOperatorsByType[fieldDef.type.name] || [];
      throw new Error(
        `Unsupported operator ${filters.operator} for field "${fieldDef.name}" of type "${fieldDef.type.name}". Allowed operators are: ${allowedOperators.join(', ')}`,
      );
    }
  }

  switch (filters.operator) {
    case FieldFilterOperatorEnum.IsNull:
      return handleIsNullOperator(filters);
    case FieldFilterOperatorEnum.Between:
      return handleBetweenOperator(filters);
    case FieldFilterOperatorEnum.Eq:
    case FieldFilterOperatorEnum.Like:
    case FieldFilterOperatorEnum.In:
    case FieldFilterOperatorEnum.Gt:
    case FieldFilterOperatorEnum.Gte:
    case FieldFilterOperatorEnum.Lt:
    case FieldFilterOperatorEnum.Lte:
      return handleBinaryOperator(filters, fieldDef, type);

    default:
      throw new Error(`Can't build filter condition`);
  }
}

function isOperatorSupported(operator: FieldFilterOperatorEnum): boolean {
  return supportedOperators.includes(operator);
}

function isFieldFilterSupported(fieldDef: IntrospectionField): boolean {
  return fieldDef?.type.name === TypeName.String;
}

export function isOperatorAllowedForField(
  operator: FieldFilterOperatorEnum,
  fieldDef: IntrospectionField,
  type: ProcessType,
): boolean {
  if (isEnumFilter(fieldDef.name, type) && isValidEnumOperator(operator)) {
    return true;
  }

  const allowedForType = supportedOperatorsByType[fieldDef.type.name];
  return allowedForType ? allowedForType.includes(operator) : false;
}

function convertToBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false; // Default to false for unsupported types
}

function formatValue(
  fieldName: string,
  fieldValue: any,
  fieldDef: IntrospectionField | undefined,
  type: ProcessType,
): string {
  if (!fieldDef) {
    return `${fieldValue}`;
  }

  if (!isFieldFilterSupported) {
    throw new Error(`Unsupported field type ${fieldDef.type.name}`);
  }

  if (isEnumFilter(fieldName, type)) {
    return `${fieldValue}`;
  }
  if (
    fieldDef.type.name === TypeName.String ||
    fieldDef.type.name === TypeName.Id ||
    fieldDef.type.name === TypeName.Date
  ) {
    return `${fieldValue}`;
  }
  throw new Error(
    `Failed to format value for ${fieldName} ${fieldValue} with type ${fieldDef.type.name}`,
  );
}

function getGraphQLOperator(operator: FieldFilterOperatorEnum): string {
  switch (operator) {
    case 'EQ':
      return 'equal';
    case 'LIKE':
      return 'like';
    case 'IN':
      return 'in';
    case 'IS_NULL':
      return 'isNull';
    case 'GT':
      return 'greaterThan';
    case 'GTE':
      return 'greaterThanEqual';
    case 'LT':
      return 'lessThan';
    case 'LTE':
      return 'lessThanEqual';
    case 'BETWEEN':
      return 'between';
    default:
      throw new Error(`Operation "${operator}" not supported`);
  }
}

// Function for getting 4 random digits to append to the clause variable name.
// Not used for any secrets or anything
function nonSecureRandomAlphaNumeric() {
  return randomBytes(8).toString('hex').slice(0, 4);
}
