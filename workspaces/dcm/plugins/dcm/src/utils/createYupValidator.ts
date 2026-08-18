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

import * as yup from 'yup';

/**
 * Factory that creates type-safe `validate` and `isValid` functions from a Yup
 * object schema.
 *
 * The optional `transform` argument lets callers pre-process the form value
 * before it is passed to Yup (e.g. converting a string "500" to a number for
 * numeric fields).
 *
 * @example
 * const { validate, isValid } = createYupValidator<ProviderForm>(providerSchema);
 * const errors = validate(form);   // Partial<Record<keyof ProviderForm, string>>
 * const ok = isValid(form);        // boolean
 */
export function createYupValidator<T extends Record<string, unknown>>(
  schema: yup.ObjectSchema<any>,
  transform?: (form: T) => Record<string, unknown>,
) {
  type Errors = Partial<Record<keyof T, string>>;

  const validate = (form: T): Errors => {
    try {
      schema.validateSync(transform ? transform(form) : form, {
        abortEarly: false,
      });
      return {};
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        return Object.fromEntries(
          err.inner.map(e => [e.path, e.message]),
        ) as Errors;
      }
      return {};
    }
  };

  const isValid = (form: T): boolean =>
    Object.keys(validate(form)).length === 0;

  return { validate, isValid };
}
