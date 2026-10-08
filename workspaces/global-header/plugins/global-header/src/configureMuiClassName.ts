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

import { unstable_ClassNameGenerator as ClassNameGenerator } from '@mui/material/className';

/**
 * Prefix MUI class names so global-header styles do not clash with the host.
 * Imported only from lazy UI entry points (`GlobalHeader`, `/components`,
 * `/legacy`) so MUI stays off the root NFS sync chunk.
 */
ClassNameGenerator.configure(componentName =>
  componentName.startsWith('v5-') ? componentName : `v5-${componentName}`,
);
