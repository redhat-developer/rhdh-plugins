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

import type { DropdownEntry } from '../utils/menuItemGrouping';
import { MenuSection } from '../../components/HeaderDropdownComponent/MenuSection';

/** Renders a standalone component or a data-driven `MenuSection`. */
const DropdownItem = ({
  entry,
  isLast,
  handleClose,
}: {
  entry: DropdownEntry;
  isLast: boolean;
  handleClose: () => void;
}) => {
  if (entry.type === 'component') {
    const Comp = entry.item.component;
    if (!Comp) return null;
    return (
      <Comp
        handleClose={handleClose}
        hideDivider={isLast}
        title={entry.item.title}
        titleKey={entry.item.titleKey}
        icon={entry.item.icon}
        link={entry.item.link}
      />
    );
  }

  const { sectionLabel, sectionLink, sectionLinkLabel, items } = entry.group;
  return (
    <MenuSection
      sectionLabel={sectionLabel || undefined}
      optionalLink={sectionLink}
      optionalLinkLabel={sectionLinkLabel}
      items={items}
      handleClose={handleClose}
      hideDivider={isLast || !sectionLabel}
    />
  );
};

/**
 * Renders the menu content for a {@link GlobalHeaderDropdown}.
 *
 * Maps each entry to either a standalone component or a `MenuSection`.
 */
export const GlobalHeaderDropdownContent = ({
  entries,
  target,
  handleClose,
}: {
  entries: DropdownEntry[];
  target: string;
  handleClose: () => void;
}) => (
  <>
    {entries.map((entry, i) => (
      <DropdownItem
        key={`${target}-${i}`}
        entry={entry}
        isLast={i === entries.length - 1}
        handleClose={handleClose}
      />
    ))}
  </>
);
