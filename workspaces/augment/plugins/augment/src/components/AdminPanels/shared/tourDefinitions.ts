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

/**
 * Tour type definitions used by TourProvider at runtime.
 * Tour DATA is now in defaultTours.ts (built-in defaults) or loaded from YAML.
 * This file only contains the types and action union needed by the tour engine.
 */

import type { DriveStep } from 'driver.js';
import type { AdminPanel } from '../../../hooks';

/**
 * Tour identifier -- string-based to support dynamic tours from YAML.
 */
export type TourId = string;

/**
 * Tour category for grouping in the launcher UI.
 */
export type TourCategory = string;

/**
 * Page context for filtering tours by where they should appear.
 */
export type TourPage = 'marketplace' | 'command-center' | 'any';

/**
 * Actions that the tour engine can execute before highlighting a step.
 * These map to TourControllerAPI methods in TourController.tsx.
 */
export type TourAction =
  | { type: 'navigate'; panel: AdminPanel }
  | { type: 'openAgentIntent' }
  | { type: 'selectAgentIntent'; cardId: string }
  | { type: 'openToolIntent' }
  | { type: 'selectToolDeploy' }
  | { type: 'closeDialogs' }
  | { type: 'setWizardStep'; step: number }
  | { type: 'setDeployMethod'; method: string }
  | { type: 'clickSelector'; selector: string }
  | { type: 'switchToMarketplace' }
  | { type: 'switchToCommandCenter' };

/**
 * Extended driver.js step with tour-specific action and selector metadata.
 */
export interface EnhancedDriveStep extends DriveStep {
  tourAction?: TourAction;
  tourSelector?: string;
}
