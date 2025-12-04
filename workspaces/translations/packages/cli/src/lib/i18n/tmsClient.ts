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

import axios, { AxiosInstance } from 'axios';

export interface TMSProject {
  id: string;
  name: string;
  languages: string[];
  status: string;
}

export interface TMSUploadResult {
  projectName: string;
  fileName: string;
  keyCount: number;
  languages: string[];
  translationJobId?: string;
}

export interface TMSDownloadOptions {
  includeCompleted: boolean;
  includeDraft: boolean;
  format: string;
}

export class TMSClient {
  private client: AxiosInstance;
  private baseUrl: string;
  // private token: string;

  constructor(baseUrl: string, token: string) {
    // Normalize URL: if it's a web UI URL, convert to API URL
    // Web UI: https://cloud.memsource.com/web/project2/show/...
    // Base: https://cloud.memsource.com/web
    // API: https://cloud.memsource.com/web/api2 (Memsource uses /api2 for v2 API)
    let normalizedUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash

    // If URL contains web UI paths, extract base and use API endpoint
    if (
      normalizedUrl.includes('/project2/show/') ||
      normalizedUrl.includes('/project/')
    ) {
      // Extract base URL (e.g., https://cloud.memsource.com/web)
      const urlMatch = normalizedUrl.match(/^(https?:\/\/[^\/]+\/web)/);
      if (urlMatch) {
        normalizedUrl = `${urlMatch[1]}/api2`; // Memsource uses /api2
      } else {
        // Fallback: try to extract domain and use /web/api2
        const domainMatch = normalizedUrl.match(/^(https?:\/\/[^\/]+)/);
        if (domainMatch) {
          normalizedUrl = `${domainMatch[1]}/web/api2`;
        }
      }
    } else if (
      normalizedUrl === 'https://cloud.memsource.com/web' ||
      normalizedUrl.endsWith('/web')
    ) {
      // If it's the base web URL, append /api2 (Memsource API v2)
      normalizedUrl = `${normalizedUrl}/api2`;
    } else if (!normalizedUrl.includes('/api')) {
      // If URL doesn't contain /api and isn't the base web URL, append /api2
      normalizedUrl = `${normalizedUrl}/api2`;
    } else if (
      normalizedUrl.includes('/api') &&
      !normalizedUrl.includes('/api2')
    ) {
      // If it has /api but not /api2, replace with /api2
      normalizedUrl = normalizedUrl.replace(/\/api(\/|$)/, '/api2$1');
    }

    this.baseUrl = normalizedUrl;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Test connection to TMS
   * For Memsource, we skip health check and verify connection by trying to get project info instead
   */
  async testConnection(): Promise<void> {
    // Memsource API doesn't have a standard /health endpoint
    // Connection will be tested when we actually make API calls
    // This is a no-op for now - actual connection test happens in API calls
    return Promise.resolve();
  }

  /**
   * Get project information
   */
  async getProjectInfo(projectId: string): Promise<TMSProject> {
    try {
      // baseURL already includes /api, so use /projects/{id}
      const response = await this.client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get project info: ${error}`);
    }
  }

  /**
   * Upload translation file to TMS
   */
  async uploadTranslationFile(
    projectId: string,
    content: string,
    fileExtension: string,
    targetLanguages?: string[],
    fileName?: string,
  ): Promise<TMSUploadResult> {
    try {
      const formData = new FormData();
      const blob = new Blob([content], { type: 'application/json' });
      // Use provided filename or default to "reference"
      const uploadFileName = fileName || `reference${fileExtension}`;
      formData.append('file', blob, uploadFileName);
      formData.append('projectId', projectId);

      if (targetLanguages && targetLanguages.length > 0) {
        formData.append('targetLanguages', targetLanguages.join(','));
      }

      // baseURL already includes /api, so use /translations/upload
      const response = await this.client.post(
        '/translations/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload translation file: ${error}`);
    }
  }

  /**
   * Download translations from TMS
   */
  async downloadTranslations(
    projectId: string,
    language: string,
    options: TMSDownloadOptions,
  ): Promise<Record<string, string>> {
    try {
      const params = new URLSearchParams({
        projectId,
        language,
        includeCompleted: options.includeCompleted.toString(),
        includeDraft: options.includeDraft.toString(),
        format: options.format,
      });

      // baseURL already includes /api, so use /translations/download
      const response = await this.client.get(
        `/translations/download?${params}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download translations: ${error}`);
    }
  }

  /**
   * Get translation status for a project
   */
  async getTranslationStatus(projectId: string): Promise<{
    totalKeys: number;
    completedKeys: number;
    languages: { [language: string]: { completed: number; total: number } };
  }> {
    try {
      // baseURL already includes /api, so use /projects/{id}/status
      const response = await this.client.get(`/projects/${projectId}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get translation status: ${error}`);
    }
  }

  /**
   * List available projects
   */
  async listProjects(): Promise<TMSProject[]> {
    try {
      const response = await this.client.get('/api/projects');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list projects: ${error}`);
    }
  }

  /**
   * Create a new translation project
   */
  async createProject(name: string, languages: string[]): Promise<TMSProject> {
    try {
      const response = await this.client.post('/api/projects', {
        name,
        languages,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create project: ${error}`);
    }
  }
}
