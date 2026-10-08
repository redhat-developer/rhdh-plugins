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

import { sanitizeClonedDom } from './sensitive-data-redactor';

const DEFAULT_QUALITY = 0.7;
const DEFAULT_MAX_WIDTH = 1280;
const DEFAULT_TIMEOUT_MS = 1000;
const DEFAULT_EXCLUDE_SELECTOR = '[data-screen-capture-exclude]';

export interface CaptureOptions {
  /** Image quality 0-1 (default: 0.7) */
  quality?: number;
  /** CSS selector for elements to exclude (default: '[data-screen-capture-exclude]') */
  excludeSelector?: string;
  /** Max output width in pixels for compression (default: 1280) */
  maxWidth?: number;
  /** Maximum time allowed for capture in ms (default: 1000) */
  timeoutMs?: number;
}

export interface CaptureResult {
  success: true;
  /** Base64-encoded image without the data URI prefix */
  base64: string;
  /** MIME type: 'image/jpeg' */
  contentType: string;
  width: number;
  height: number;
  /** Time taken for the capture in milliseconds */
  captureTimeMs: number;
}

export interface CaptureError {
  success: false;
  error: string;
}

export type CaptureResponse = CaptureResult | CaptureError;

function stripDataUriPrefix(dataUri: string): string {
  const commaIdx = dataUri.indexOf(',');
  return commaIdx !== -1 ? dataUri.slice(commaIdx + 1) : dataUri;
}

function waitForIdle(): Promise<void> {
  return new Promise(resolve => {
    if ('requestIdleCallback' in window) {
      (window as Window).requestIdleCallback(() => resolve(), { timeout: 100 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

function scaleCanvas(
  canvas: HTMLCanvasElement,
  maxWidth: number,
): HTMLCanvasElement {
  if (canvas.width <= maxWidth) {
    return canvas;
  }

  const scaleFactor = maxWidth / canvas.width;
  const scaledWidth = maxWidth;
  const scaledHeight = Math.round(canvas.height * scaleFactor);

  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = scaledWidth;
  scaledCanvas.height = scaledHeight;

  const ctx = scaledCanvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }
  ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);

  return scaledCanvas;
}

async function doCapture(
  options: Required<CaptureOptions>,
): Promise<CaptureResponse> {
  const targetElement = document.querySelector('#root');
  if (!targetElement) {
    return { success: false, error: 'Root element (#root) not found' };
  }

  const { default: html2canvas } = await import('html2canvas-pro');

  const start = window.performance.now();

  const canvas = await html2canvas(targetElement as HTMLElement, {
    useCORS: true,
    allowTaint: false,
    logging: false,
    onclone: (clonedDocument: Document) => {
      sanitizeClonedDom(clonedDocument);
    },
    ignoreElements: (element: Element) => {
      if (element.hasAttribute('data-screen-capture-exclude')) {
        return true;
      }
      if (element.classList.contains('pf-chatbot')) {
        return true;
      }
      if (options.excludeSelector !== DEFAULT_EXCLUDE_SELECTOR) {
        try {
          if (element.matches(options.excludeSelector)) {
            return true;
          }
        } catch {
          // Invalid selector — skip rather than crash capture
        }
      }
      return false;
    },
  });

  let scaledCanvas: HTMLCanvasElement | undefined;
  try {
    scaledCanvas = scaleCanvas(canvas, options.maxWidth);
    const dataUri = scaledCanvas.toDataURL('image/jpeg', options.quality);

    const captureTimeMs = Math.round(window.performance.now() - start);

    return {
      success: true,
      base64: stripDataUriPrefix(dataUri),
      contentType: 'image/jpeg',
      width: scaledCanvas.width,
      height: scaledCanvas.height,
      captureTimeMs,
    };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    if (scaledCanvas && scaledCanvas !== canvas) {
      scaledCanvas.width = 0;
      scaledCanvas.height = 0;
    }
  }
}

/**
 * Captures a screenshot of the current RHDH viewport, excluding the
 * Lightspeed chat panel and redacting sensitive data.
 *
 * Outputs JPEG format.
 * Includes performance guardrails: visibility check, idle deferral, and timeout.
 */
export async function captureScreenshot(
  options?: CaptureOptions,
): Promise<CaptureResponse> {
  if (document.visibilityState === 'hidden') {
    return { success: false, error: 'Tab not visible' };
  }

  await waitForIdle();

  const resolvedOptions: Required<CaptureOptions> = {
    quality: options?.quality ?? DEFAULT_QUALITY,
    excludeSelector: options?.excludeSelector ?? DEFAULT_EXCLUDE_SELECTOR,
    maxWidth: options?.maxWidth ?? DEFAULT_MAX_WIDTH,
    timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };

  // When the timeout wins the race, doCapture continues running in the background
  // since html2canvas-pro does not support AbortController-based cancellation.
  // The timeout prevents the caller from waiting indefinitely; background work
  // completes harmlessly and its result is discarded.
  let timeoutId: ReturnType<typeof setTimeout>;
  try {
    const result = await Promise.race<CaptureResponse>([
      doCapture(resolvedOptions),
      new Promise<CaptureError>(resolve => {
        timeoutId = setTimeout(
          () => resolve({ success: false, error: 'Capture timeout exceeded' }),
          resolvedOptions.timeoutMs,
        );
      }),
    ]);
    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown capture error',
    };
  } finally {
    clearTimeout(timeoutId!);
  }
}
