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

import html2canvas from 'html2canvas-pro';

import { captureScreenshot } from '../screen-capture';
import { sanitizeClonedDom } from '../sensitive-data-redactor';

jest.mock('html2canvas-pro');
jest.mock('../sensitive-data-redactor', () => ({
  sanitizeClonedDom: jest.fn(),
}));

const mockHtml2canvas = html2canvas as jest.MockedFunction<typeof html2canvas>;
const mockSanitize = sanitizeClonedDom as jest.MockedFunction<
  typeof sanitizeClonedDom
>;

function createMockCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'width', { value: width, writable: true });
  Object.defineProperty(canvas, 'height', { value: height, writable: true });

  canvas.toDataURL = jest.fn((type?: string, quality?: unknown) => {
    if (type === 'image/jpeg') {
      return `data:image/jpeg;base64,JPEG_${quality}_DATA`;
    }
    return 'data:image/png;base64,DEFAULT';
  });

  canvas.getContext = jest.fn().mockReturnValue({
    drawImage: jest.fn(),
  });

  return canvas;
}

describe('captureScreenshot', () => {
  let rootElement: HTMLDivElement;

  beforeEach(() => {
    jest.clearAllMocks();

    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    (window as any).requestIdleCallback = (cb: Function) => {
      cb();
      return 0;
    };

    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
    }) as any;
    HTMLCanvasElement.prototype.toDataURL = jest.fn(
      (type?: string, quality?: unknown) => {
        if (type === 'image/jpeg') {
          return `data:image/jpeg;base64,SCALED_JPEG_${quality}_DATA`;
        }
        return 'data:image/png;base64,DEFAULT';
      },
    );
  });

  afterEach(() => {
    if (document.body.contains(rootElement)) {
      document.body.removeChild(rootElement);
    }
    delete (window as any).requestIdleCallback;
  });

  it('should return JPEG format', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const result = await captureScreenshot();

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        contentType: 'image/jpeg',
        base64: 'JPEG_0.7_DATA',
        width: 800,
        height: 600,
        captureTimeMs: expect.any(Number),
      }),
    );
  });

  it('should return CaptureError when tab is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });

    const result = await captureScreenshot();

    expect(result).toEqual({ success: false, error: 'Tab not visible' });
    expect(mockHtml2canvas).not.toHaveBeenCalled();
  });

  it('should return CaptureError on timeout', async () => {
    mockHtml2canvas.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(createMockCanvas(800, 600)), 5000);
        }),
    );

    const result = await captureScreenshot({ timeoutMs: 50 });

    expect(result).toEqual({
      success: false,
      error: 'Capture timeout exceeded',
    });
  });

  it('should return CaptureError when #root is not found', async () => {
    document.body.removeChild(rootElement);

    const result = await captureScreenshot();

    expect(result).toEqual({
      success: false,
      error: 'Root element (#root) not found',
    });

    document.body.appendChild(rootElement);
  });

  it('should call sanitizeClonedDom in onclone', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockImplementation(async (_el, options) => {
      if (options?.onclone) {
        (options.onclone as Function)(document);
      }
      return mockCanvas;
    });

    await captureScreenshot();

    expect(mockSanitize).toHaveBeenCalledWith(document);
  });

  it('should exclude elements with data-screen-capture-exclude', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    let ignoreElementsFn: ((el: Element) => boolean) | undefined;

    mockHtml2canvas.mockImplementation(async (_el, options) => {
      ignoreElementsFn = options?.ignoreElements as
        ((el: Element) => boolean) | undefined;
      return mockCanvas;
    });

    await captureScreenshot();

    expect(ignoreElementsFn).toBeDefined();

    const excludedElement = document.createElement('div');
    excludedElement.setAttribute('data-screen-capture-exclude', '');
    expect(ignoreElementsFn!(excludedElement)).toBe(true);

    const normalElement = document.createElement('div');
    expect(ignoreElementsFn!(normalElement)).toBe(false);
  });

  it('should exclude elements with pf-chatbot class', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    let ignoreElementsFn: ((el: Element) => boolean) | undefined;

    mockHtml2canvas.mockImplementation(async (_el, options) => {
      ignoreElementsFn = options?.ignoreElements as
        ((el: Element) => boolean) | undefined;
      return mockCanvas;
    });

    await captureScreenshot();

    const chatElement = document.createElement('div');
    chatElement.classList.add('pf-chatbot');
    expect(ignoreElementsFn!(chatElement)).toBe(true);
  });

  it('should scale down canvas when width exceeds maxWidth', async () => {
    const mockCanvas = createMockCanvas(2560, 1440);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const result = await captureScreenshot({ maxWidth: 1280 });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        width: 1280,
        height: 720,
        contentType: 'image/jpeg',
      }),
    );
  });

  it('should not scale canvas when width is within maxWidth', async () => {
    const mockCanvas = createMockCanvas(1024, 768);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const result = await captureScreenshot({ maxWidth: 1280 });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        width: 1024,
        height: 768,
      }),
    );
  });

  it('should use custom quality parameter', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const result = await captureScreenshot({ quality: 0.5 });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        base64: 'JPEG_0.5_DATA',
      }),
    );
  });

  it('should return CaptureError when html2canvas throws', async () => {
    mockHtml2canvas.mockRejectedValue(new Error('Canvas rendering failed'));

    const result = await captureScreenshot();

    expect(result).toEqual({
      success: false,
      error: 'Canvas rendering failed',
    });
  });

  it('should use setTimeout fallback when requestIdleCallback is unavailable', async () => {
    delete (window as any).requestIdleCallback;

    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const result = await captureScreenshot();

    expect(result.success).toBe(true);
  });

  it('should report captureTimeMs', async () => {
    const mockCanvas = createMockCanvas(800, 600);
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const result = await captureScreenshot();

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        captureTimeMs: expect.any(Number),
      }),
    );
  });
});
