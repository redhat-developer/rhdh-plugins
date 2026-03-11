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

import { useTranslation } from '../hooks/useTranslation';

type TFunc = ReturnType<typeof useTranslation>['t'];

interface TransProps {
  message: Parameters<TFunc>[0];
  params?: Parameters<TFunc>[1];
}

export const Trans = ({ message, params }: TransProps) => {
  const { t } = useTranslation();
  return t(message, ...(params ? [params] : ([] as any)));
};
