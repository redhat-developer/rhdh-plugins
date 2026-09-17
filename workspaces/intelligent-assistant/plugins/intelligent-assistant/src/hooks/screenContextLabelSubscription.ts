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

import { PAGE_CHROME_ROOT_SELECTORS } from '../utils/dom-selectors';
import { resolveScreenContextChipLabel } from '../utils/screen-context-utils';

const listeners = new Set<() => void>();
let historyPatched = false;
let pageChromeObserver: MutationObserver | undefined;
let notifyScheduled = false;

function notifyScreenContextLabelListeners() {
  listeners.forEach(listener => listener());
}

function scheduleNotifyScreenContextLabelListeners() {
  if (notifyScheduled || typeof window === 'undefined') {
    return;
  }
  notifyScheduled = true;
  window.requestAnimationFrame(() => {
    notifyScheduled = false;
    notifyScreenContextLabelListeners();
  });
}

function isInsideScreenCaptureExclude(node: Node): boolean {
  if (!(node instanceof Element)) {
    return false;
  }
  return Boolean(node.closest('[data-screen-capture-exclude]'));
}

function shouldReactToMutation(mutations: MutationRecord[]): boolean {
  for (const mutation of mutations) {
    if (
      mutation.target instanceof Node &&
      isInsideScreenCaptureExclude(mutation.target)
    ) {
      continue;
    }
    return true;
  }
  return false;
}

const observedChromeNodes = new WeakSet<Node>();

function collectPageChromeObserveTargets(): Node[] {
  const observeTargets: Node[] = [];
  const titleEl = document.querySelector('title');
  if (titleEl) {
    observeTargets.push(titleEl);
  }
  for (const selector of PAGE_CHROME_ROOT_SELECTORS) {
    const node = document.querySelector(selector);
    if (node && !observeTargets.includes(node)) {
      observeTargets.push(node);
    }
  }
  if (observeTargets.length === 0 && document.body) {
    observeTargets.push(document.body);
  }
  return observeTargets;
}

function ensurePageChromeObserver() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!pageChromeObserver) {
    pageChromeObserver = new MutationObserver(mutations => {
      if (shouldReactToMutation(mutations)) {
        scheduleNotifyScreenContextLabelListeners();
      }
    });
  }

  for (const target of collectPageChromeObserveTargets()) {
    if (observedChromeNodes.has(target)) {
      continue;
    }
    observedChromeNodes.add(target);
    pageChromeObserver.observe(target, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }
}

/**
 * Patch at module load so we wrap Backstage / React Router history wrappers too.
 */
export function patchBrowserHistoryForScreenContext() {
  if (historyPatched || typeof window === 'undefined') {
    return;
  }
  historyPatched = true;

  window.addEventListener('popstate', notifyScreenContextLabelListeners);
  window.addEventListener('hashchange', notifyScreenContextLabelListeners);

  const { pushState, replaceState } = window.history;
  window.history.pushState = function pushStatePatched(...args) {
    pushState.apply(this, args);
    notifyScreenContextLabelListeners();
  };
  window.history.replaceState = function replaceStatePatched(...args) {
    replaceState.apply(this, args);
    notifyScreenContextLabelListeners();
  };

  const proto = window.History.prototype;
  const protoPushState = proto.pushState;
  const protoReplaceState = proto.replaceState;
  proto.pushState = function historyProtoPushState(...args) {
    protoPushState.apply(this, args);
    notifyScreenContextLabelListeners();
  };
  proto.replaceState = function historyProtoReplaceState(...args) {
    protoReplaceState.apply(this, args);
    notifyScreenContextLabelListeners();
  };
}

patchBrowserHistoryForScreenContext();

let cachedSnapshot = '';

export function getScreenContextLabelSnapshot(): string {
  const pathname = window.location.pathname;
  const search = window.location.search;
  const { label } = resolveScreenContextChipLabel({ pathname, search });
  const next = `${pathname}\0${search}\0${label}`;
  if (next !== cachedSnapshot) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

export function subscribeToScreenContextLabel(
  onStoreChange: () => void,
): () => void {
  ensurePageChromeObserver();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/** @internal For unit tests only. */
export function resetScreenContextLabelSnapshotCache(): void {
  cachedSnapshot = '';
}
