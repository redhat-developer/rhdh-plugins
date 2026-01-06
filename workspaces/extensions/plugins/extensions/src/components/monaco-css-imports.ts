/*
 * Copyright The Backstage Authors
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
 * Import all Monaco Editor CSS files in the correct dependency order.
 * This ensures all CSS is loaded statically before Monaco Editor initializes,
 * preventing CSS ordering conflicts during build (especially in CI).
 *
 * Import order is critical - must match Monaco Editor's internal dependency order.
 * Based on CI errors, the order must be:
 * 1. Base foundation CSS (aria, scrollbars, blockDecorations)
 * 2. Standalone tokens (must come after base foundation)
 * 3. Platform CSS
 * 4. Base UI components
 * 5. Layout components (splitview before tree)
 * 6. Editor widget CSS (codeEditor before diffEditor)
 * 7. Table CSS (after diffEditor)
 */

// Base foundation CSS - must come FIRST before standalone-tokens
import 'monaco-editor/esm/vs/base/browser/ui/aria/aria.css';
import 'monaco-editor/esm/vs/base/browser/ui/scrollbar/media/scrollbars.css';
import 'monaco-editor/esm/vs/editor/browser/viewParts/blockDecorations/blockDecorations.css';

// Standalone tokens - must come after base foundation CSS
import 'monaco-editor/esm/vs/editor/standalone/browser/standalone-tokens.css';

// Platform CSS
import 'monaco-editor/esm/vs/platform/hover/browser/hover.css';

// Core UI components (dependencies) - must come before components that depend on them
import 'monaco-editor/esm/vs/base/browser/ui/contextview/contextview.css';
import 'monaco-editor/esm/vs/base/browser/ui/hover/hoverWidget.css';
import 'monaco-editor/esm/vs/base/browser/ui/actionbar/actionbar.css';
import 'monaco-editor/esm/vs/base/browser/ui/button/button.css';
import 'monaco-editor/esm/vs/base/browser/ui/dropdown/dropdown.css';
import 'monaco-editor/esm/vs/base/browser/ui/sash/sash.css';
import 'monaco-editor/esm/vs/base/browser/ui/toggle/toggle.css';

// Toolbar and related components (must come before components that depend on it)
import 'monaco-editor/esm/vs/base/browser/ui/toolbar/toolbar.css';
import 'monaco-editor/esm/vs/base/browser/ui/keybindingLabel/keybindingLabel.css';

// Layout components - splitview must come before tree
import 'monaco-editor/esm/vs/base/browser/ui/splitview/splitview.css';
import 'monaco-editor/esm/vs/base/browser/ui/tree/media/tree.css';

// Input and selection components (depend on toolbar and layout)
import 'monaco-editor/esm/vs/base/browser/ui/iconLabel/iconlabel.css';
import 'monaco-editor/esm/vs/base/browser/ui/findinput/findInput.css';
import 'monaco-editor/esm/vs/base/browser/ui/dnd/dnd.css';
import 'monaco-editor/esm/vs/base/browser/ui/list/list.css';
import 'monaco-editor/esm/vs/base/browser/ui/selectBox/selectBox.css';

// Editor widget CSS - codeEditor must come before diffEditor
import 'monaco-editor/esm/vs/editor/browser/widget/codeEditor/editor.css';
import 'monaco-editor/esm/vs/editor/browser/widget/diffEditor/style.css';

// Table CSS - must come after diffEditor
import 'monaco-editor/esm/vs/base/browser/ui/table/table.css';
