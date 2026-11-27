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

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { MessageBar, MessageBarProps } from '@patternfly/chatbot';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuList,
  Popper,
} from '@patternfly/react-core';

import { useSkills } from '../hooks/useSkills';
import { useTranslation } from '../hooks/useTranslation';
import { Skill } from '../types';

type SkillsMessageBarProps = Omit<
  MessageBarProps,
  'value' | 'onChange' | 'innerRef'
> & {
  value: string;
  onChange: (value: string) => void;
};

const findTrigger = (value: string, cursor: number) => {
  const match = value.slice(0, cursor).match(/(?:^|\s)\/([^\s/]*)$/);
  return match
    ? { start: cursor - match[1].length - 1, cursor, search: match[1] }
    : null;
};

// Uses the Menu + Popper and controlled input pattern from PatternFly chatbot
// PR #902's command-parsing demo, leaving execution to the chat API.
export const SkillsMessageBar = ({
  value,
  onChange,
  onSendMessage,
  ...props
}: SkillsMessageBarProps) => {
  const { t } = useTranslation();
  const menuId = `skills-menu-${useId()}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingCursor = useRef<number | null>(null);
  const [trigger, setTrigger] = useState<ReturnType<typeof findTrigger>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { skills, loading, error, denied } = useSkills(trigger !== null);
  const search = trigger?.search.toLowerCase() ?? '';
  const filteredSkills = skills.filter(
    skill =>
      skill.name.toLowerCase().includes(search) ||
      skill.description.toLowerCase().includes(search),
  );
  const isOpen = trigger !== null;
  const activeSkill = filteredSkills[activeIndex];
  const itemId = useCallback(
    (skill: Skill) => `${menuId}-${encodeURIComponent(skill.name)}`,
    [menuId],
  );
  let status: string | undefined;
  if (denied) {
    status = t('skills.permissionDenied');
  } else if (loading) {
    status = t('skills.loading');
  } else if (error) {
    status = t('skills.error');
  } else if (!filteredSkills.length) {
    status = t(skills.length ? 'skills.noMatch' : 'skills.empty');
  }

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        !menuRef.current?.contains(event.target as Node) &&
        !textareaRef.current?.contains(event.target as Node)
      ) {
        setTrigger(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // An external draft change (for example a saved prompt) dismisses old matches.
  useEffect(() => {
    if (
      trigger &&
      (value[trigger.start] !== '/' ||
        value.slice(trigger.start + 1, trigger.cursor) !== trigger.search)
    ) {
      setTrigger(null);
    }
  }, [value, trigger]);

  useEffect(() => {
    if (pendingCursor.current === null) return undefined;
    // MessageBar synchronizes its own value in an effect. Restore the caret once
    // that update has reached the textarea, as in the PatternFly demo.
    const frame = requestAnimationFrame(() => {
      if (pendingCursor.current !== null) {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          pendingCursor.current,
          pendingCursor.current,
        );
        pendingCursor.current = null;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [value, isOpen]);

  useEffect(() => {
    if (isOpen && activeSkill) {
      document
        .getElementById(itemId(activeSkill))
        ?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [isOpen, activeSkill, itemId]);

  const selectSkill = (skill: Skill) => {
    if (!trigger || status) return;
    const before = value.slice(0, trigger.start);
    // Replace the whole token when the caret is in the middle of a skill name.
    const after = value.slice(trigger.cursor).replace(/^\S*/, '');
    const command = `/${skill.name}`;
    const separator = /^\s/.test(after) ? '' : ' ';
    pendingCursor.current = before.length + command.length + separator.length;
    onChange(`${before}${command}${separator}${after}`);
    setTrigger(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      !isOpen ||
      event.nativeEvent.isComposing ||
      event.nativeEvent.keyCode === 229
    )
      return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setTrigger(null);
    } else if (event.key === 'Tab') {
      setTrigger(null);
    } else if (
      !status &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      event.preventDefault();
      event.stopPropagation();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(
        previous =>
          (previous + direction + filteredSkills.length) %
          filteredSkills.length,
      );
    } else if (
      !status &&
      activeSkill &&
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      event.stopPropagation();
      selectSkill(activeSkill);
    }
  };

  const menu = (
    <Menu
      ref={menuRef}
      role="listbox"
      onMouseDown={event => event.preventDefault()}
      onSelect={(_event, selected) => {
        const skill = filteredSkills.find(item => item.name === selected);
        if (skill) selectSkill(skill);
      }}
    >
      <MenuContent maxMenuHeight="min(320px, 40vh)">
        <MenuGroup label={t('skills.title')}>
          <MenuList id={menuId} aria-label={t('skills.title')}>
            {status ? (
              <MenuItem isDisabled>
                <div id={`${menuId}-status`} role="status">
                  {status}
                </div>
              </MenuItem>
            ) : (
              filteredSkills.map((skill, index) => (
                <MenuItem
                  key={skill.name}
                  id={itemId(skill)}
                  itemId={skill.name}
                  description={skill.description}
                  isFocused={index === activeIndex}
                >
                  /{skill.name}
                </MenuItem>
              ))
            )}
          </MenuList>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );

  return (
    <>
      <Popper
        triggerRef={textareaRef}
        popper={menu}
        isVisible={isOpen}
        placement="top-start"
        width="trigger"
        enableFlip
      />
      <MessageBar
        {...props}
        value={value}
        innerRef={textareaRef}
        onChange={(_event, nextValue) => {
          const next = String(nextValue);
          const cursor = textareaRef.current?.selectionStart ?? next.length;
          onChange(next);
          setTrigger(findTrigger(next, cursor));
          setActiveIndex(0);
        }}
        onSelect={() => {
          if (trigger && textareaRef.current) {
            const next = findTrigger(value, textareaRef.current.selectionStart);
            setTrigger(next?.start === trigger.start ? next : null);
            setActiveIndex(0);
          }
        }}
        onSendMessage={message => {
          setTrigger(null);
          onSendMessage(message);
        }}
        // Capture only menu keys so MessageBar retains its send, newline and IME handling.
        onKeyDownCapture={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-describedby={isOpen && status ? `${menuId}-status` : undefined}
        aria-activedescendant={
          isOpen && !status && activeSkill ? itemId(activeSkill) : undefined
        }
      />
    </>
  );
};
