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
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react';

import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';

interface ChatPanelContextType {
  isOpen: boolean;
  togglePanel: () => void;
}

const ChatPanelContext = createContext<ChatPanelContextType | undefined>(
  undefined,
);

const useChatPanel = () => {
  const context = useContext(ChatPanelContext);
  if (!context) {
    throw new Error('useChatPanel must be used within ChatPanelProvider');
  }
  return context;
};

export const ChatPanelProvider = ({ children }: PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <ChatPanelContext.Provider value={{ isOpen, togglePanel }}>
      {children}
      {isOpen && (
        <Typography
          component="div"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            width: '350px',
            height: '400px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography
            component="div"
            style={{
              padding: '16px',
              borderBottom: '1px solid #eee',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography component="span">Chat Panel</Typography>
            <Button size="small" onClick={togglePanel}>
              Close
            </Button>
          </Typography>
          <Typography
            component="div"
            style={{ flex: 1, padding: '16px', overflowY: 'auto' }}
          >
            <Typography component="p">This is a custom chat panel!</Typography>
            <Typography component="p">
              It demonstrates how a custom FAB component can manage its own
              state through context.
            </Typography>
            <Typography
              component="p"
              style={{ color: '#666', fontSize: '14px' }}
            >
              Have a nice day !!
            </Typography>
          </Typography>
        </Typography>
      )}
    </ChatPanelContext.Provider>
  );
};

// Custom FAB Component
export const ChatFABComponent = () => {
  const { isOpen, togglePanel } = useChatPanel();

  return (
    <Tooltip title={isOpen ? 'Close Chat' : 'Open Chat'} placement="left">
      <Fab
        size="small"
        color={isOpen ? 'default' : 'primary'}
        onClick={togglePanel}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        sx={{
          transition: 'all 0.3s ease',
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </Tooltip>
  );
};
