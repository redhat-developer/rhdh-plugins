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

import { ComponentType } from 'react';

/**
 * Props passed to a custom template card action component.
 *
 * @public
 */
export interface TemplateCardActionProps {
  /** The current template entity. */
  template: Record<string, unknown>;
  /** Callback to select this template. */
  onSelected?: () => void;
  /** Whether the user has permission to create from this template. */
  canCreateTask: boolean;
}

/**
 * Data carried by a template card action extension.
 *
 * @public
 */
export interface TemplateCardActionData {
  /** The component that renders the action button. */
  component: ComponentType<TemplateCardActionProps>;
}

/**
 * Data carried by a template card badge extension.
 *
 * @public
 */
export interface TemplateCardBadgeData {
  /** The component that renders the badge. */
  component: ComponentType<{ template: Record<string, unknown> }>;
  /** Sort order for multiple badges. Lower values render first. */
  priority?: number;
}
