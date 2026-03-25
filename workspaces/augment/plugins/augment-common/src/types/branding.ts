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
 * Branding configuration loaded from app-config.yaml.
 * Shared across frontend and backend.
 * @public
 */
export interface BrandingConfig {
  appName: string;
  tagline: string;
  inputPlaceholder: string;
  primaryColor: string;
  secondaryColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  botAvatarUrl?: string;
  themePreset?: string;
}

/**
 * Single source of truth for branding defaults.
 * Used by both frontend hooks and backend API routes.
 * @public
 */
export const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'Augment',
  tagline: 'Your AI-powered platform assistant',
  inputPlaceholder: 'Ask me anything...',
  primaryColor: '#1e40af',
  secondaryColor: '#475569',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  infoColor: '#0ea5e9',
  themePreset: 'default',
};
