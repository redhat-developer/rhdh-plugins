import { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useTheme } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { WorkflowDefinition } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { generateWorkflowCode } from './codegen/WorkflowCodeGenerator';
import { generatePythonCode } from './codegen/PythonCodeGenerator';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

interface WorkflowCodeExportProps {
  workflow: WorkflowDefinition;
  onClose: () => void;
}

export function WorkflowCodeExport({ workflow, onClose }: WorkflowCodeExportProps) {
  const configApi = useApi(configApiRef);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [topTab, setTopTab] = useState(0);
  const [sdkLang, setSdkLang] = useState(0);
  const [copied, setCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const backendUrl = configApi.getOptionalString('augment.llamaStack.baseUrl') || 'http://localhost:8321';
  const model = configApi.getOptionalString('augment.llamaStack.model') || 'meta-llama/Llama-3.3-70B-Instruct';

  const tsCode = useMemo(() => generateWorkflowCode(workflow, { llamaStackUrl: `${backendUrl}/v1`, defaultModel: model }), [workflow, backendUrl, model]);
  const pyCode = useMemo(() => generatePythonCode(workflow, { llamaStackUrl: `${backendUrl}/v1`, defaultModel: model }), [workflow, backendUrl, model]);
  const jsonCode = useMemo(() => JSON.stringify(workflow, null, 2), [workflow]);

  const currentCode = topTab === 0 ? (sdkLang === 0 ? tsCode : pyCode) : jsonCode;
  const currentLang = topTab === 0 ? (sdkLang === 0 ? 'typescript' : 'python') : 'json';
  const currentExt = topTab === 0 ? (sdkLang === 0 ? 'ts' : 'py') : 'json';

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(currentCode); setCopied(true); } catch { /* */ }
  }, [currentCode]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.${currentExt}`; a.click();
    URL.revokeObjectURL(url);
  }, [currentCode, currentExt, workflow.name]);

  const copyWorkflowId = useCallback(() => {
    navigator.clipboard.writeText(workflow.id);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  }, [workflow.id]);

  const syntaxStyle = isDark ? oneDark : oneLight;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>Get code</Typography>

        <Tabs
          value={topTab}
          onChange={(_e, v) => setTopTab(v)}
          sx={{
            minHeight: 32,
            '& .MuiTab-root': { minHeight: 32, textTransform: 'none', fontSize: '0.8rem', px: 1.5, py: 0 },
          }}
        >
          <Tab label="Agents SDK" />
          <Tab label="Integration" />
        </Tabs>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose} aria-label="Close code export" sx={{ color: 'text.secondary' }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {topTab === 1 ? (
        /* Integration tab */
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
            Use the workflow ID below to integrate this agent workflow into your application via the Responses API.
          </Typography>

          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary', mb: 1 }}>Workflow ID</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TextField variant="outlined" size="small" fullWidth value={workflow.id} InputProps={{ readOnly: true }} />
            <Tooltip title={idCopied ? 'Copied!' : 'Copy'}>
              <IconButton size="small" onClick={copyWorkflowId} aria-label="Copy workflow ID">
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary', mb: 1 }}>Current version</Typography>
          <TextField variant="outlined" size="small" fullWidth value={`version="${workflow.status}"`} InputProps={{ readOnly: true }} sx={{ mb: 3 }} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
            Use the Agents SDK to run this workflow programmatically, or export the workflow definition as JSON for external systems.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button size="small" variant="text" onClick={() => setTopTab(0)} sx={{ textTransform: 'none' }}>
              View Agents SDK code
            </Button>
            <Button size="small" variant="text" onClick={handleDownload} sx={{ textTransform: 'none' }}>
              Download JSON
            </Button>
          </Box>
        </Box>
      ) : (
        /* Agents SDK tab */
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, gap: 1 }}>
            <Tabs
              value={sdkLang}
              onChange={(_e, v) => setSdkLang(v)}
              sx={{
                minHeight: 28,
                '& .MuiTab-root': { minHeight: 28, textTransform: 'none', fontSize: '0.8rem', px: 1.5, py: 0 },
              }}
            >
              <Tab label="TypeScript" />
              <Tab label="Python" />
            </Tabs>
            <Box sx={{ flex: 1 }} />
            <FormControlLabel
              control={<Switch size="small" checked={showLineNumbers} onChange={e => setShowLineNumbers(e.target.checked)} />}
              label={<Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Lines</Typography>}
              sx={{ mr: 0.5 }}
            />
            <Tooltip title="Copy code">
              <IconButton size="small" onClick={handleCopy} aria-label="Copy code" sx={{ color: 'text.secondary' }}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Download as .${currentExt}`}>
              <IconButton size="small" onClick={handleDownload} aria-label="Download code" sx={{ color: 'text.secondary' }}>
                <DownloadIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin' }}>
            <SyntaxHighlighter
              language={currentLang}
              style={syntaxStyle}
              showLineNumbers={showLineNumbers}
              customStyle={{
                margin: 0,
                padding: '16px 20px',
                fontSize: '0.8rem',
                lineHeight: 1.7,
                background: 'transparent',
                borderRadius: 0,
              }}
              lineNumberStyle={{ fontSize: '0.7rem', color: theme.palette.text.disabled, minWidth: '2.5em' }}
            >
              {currentCode}
            </SyntaxHighlighter>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
              Targets LlamaStack Responses API via @openai/agents
            </Typography>
          </Box>
        </>
      )}

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>Code copied to clipboard</Alert>
      </Snackbar>
    </Box>
  );
}
