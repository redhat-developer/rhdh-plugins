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

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  Spinner,
  Stack,
  StackItem,
  Switch,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Tooltip,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InfoCircleIcon,
  KeyIcon,
  TimesIcon,
} from '@patternfly/react-icons';

import { type UseMcpConfigureModalResult } from '../hooks/useMcpConfigureModal';
import { useTranslation } from '../hooks/useTranslation';

const StyledModal = styled(Modal)({
  '& .pf-v6-c-modal-box__close, & .pf-v5-c-modal-box__close': {
    display: 'none',
  },
  '& .pf-v6-c-modal-box__body, & .pf-v5-c-modal-box__body': {
    paddingTop: 0,
  },
});

const ModalCloseButton = styled(Button)({
  position: 'absolute',
  top: 'var(--pf-v6-c-modal-box__close--InsetBlockStart, 1.5rem)',
  right: 'var(--pf-v6-c-modal-box__close--InsetInlineEnd, 1.5rem)',
  zIndex: 1,
});

const ModalInfoAlert = styled(Alert)({
  '--pf-v6-c-alert--m-custom--BorderColor':
    'var(--pf-t--global--color--status--info--default)',
  '--pf-v6-c-alert--m-custom__icon--Color':
    'var(--pf-t--global--color--status--info--default)',
  '& .pf-v6-c-alert__icon': {
    alignSelf: 'start',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    boxSizing: 'border-box',
    marginBlockStart: 0,
    paddingBlockStart: '18.620px',
    paddingInline: 'var(--pf-t--global--spacer--md)',
    paddingBlockEnd: 'var(--pf-t--global--spacer--md)',
  },
});

const sectionTitleSx = {
  fontSize: '0.875rem',
  fontWeight: 600,
} as const;

const sectionDescriptionSx = {
  color: 'var(--pf-t--global--text--color--subtle)',
  fontSize: '0.875rem',
} as const;

const credentialRadioDescriptionSx = {
  color: 'var(--pf-t--global--text--color--subtle)',
  fontSize: '0.875rem',
} as const;

const StatusOkIcon = styled(CheckCircleIcon)({
  color: 'var(--pf-t--global--icon--color--status--custom--default)',
});

const StatusWarnIcon = styled(ExclamationCircleIcon)({
  color: 'var(--pf-t--global--icon--color--status--danger--default)',
});

const StatusDisabledIcon = styled(InfoCircleIcon)({
  color: 'var(--pf-t--global--icon--color--subtle)',
});

const StatusWarnKeyIcon = styled(KeyIcon)({
  color: 'var(--pf-t--global--icon--color--status--danger--default)',
});

const RemovePersonalTokenButton = styled(Button)({
  borderRadius: '1.25rem',
  boxShadow: 'none',
});

type McpConfigureServerModalProps = UseMcpConfigureModalResult;

export const McpConfigureServerModal = ({
  isOpen,
  editingServer,
  close,
  save,
  removePersonalToken,
  canManageMcp,
  configureModalTitle,
  isConfigureModalSaving,
  isSaveTokenButtonDisabled,
  isUpdatingModalStatus,
  tokenInputValue,
  onTokenInputChange,
  clearTokenInput,
  tokenInputValidated,
  tokenValidationState,
  tokenHelperVariant,
  showTokenHelperText,
  tokenHelperText,
  modalCredentialMode,
  onCredentialModeChange,
  showCredentialRadios,
  showPersonalTokenField,
  onModalEnabledChange,
  isModalEnabledChecked,
  isModalEnabledToggleDisabled,
  modalDisplayStatus,
  modalStatusDetail,
  modalStatusText,
  modalTools,
  modalToolCount,
  isLoadingModalTools,
  modalToolsError,
  modalToolsEmptyText,
  modalVerifiedHasToken,
  modalEnabledDescription,
  canRemovePersonalToken,
  hasSavedTokenInModal,
  hasRemovedPersonalToken,
}: McpConfigureServerModalProps) => {
  const { t } = useTranslation();

  const renderStatusIcon = () => {
    if (isUpdatingModalStatus || isLoadingModalTools) {
      return (
        <Spinner
          size="md"
          aria-label={
            isUpdatingModalStatus
              ? t('mcp.settings.modal.loadingStatus')
              : t('mcp.settings.modal.fetchingStatus')
          }
        />
      );
    }
    if (modalDisplayStatus === 'disabled') {
      return <StatusDisabledIcon />;
    }
    if (modalDisplayStatus === 'tokenRequired') {
      return <StatusWarnKeyIcon />;
    }
    if (modalDisplayStatus === 'ok' && modalTools.length > 0) {
      return <StatusOkIcon />;
    }
    if (modalToolsError || modalDisplayStatus === 'failed') {
      return <StatusWarnIcon />;
    }
    return <StatusDisabledIcon />;
  };

  const renderToolsContent = () => {
    if (isLoadingModalTools) {
      return (
        <Spinner size="md" aria-label={t('mcp.settings.modal.loadingTools')} />
      );
    }
    if (modalTools.length > 0) {
      return (
        <List
          isPlain
          aria-label={t('mcp.settings.modal.toolsHeading' as any, {
            count: String(modalToolCount),
          })}
        >
          {modalTools.map(toolName => (
            <ListItem key={toolName} icon={<StatusOkIcon />}>
              {toolName}
            </ListItem>
          ))}
        </List>
      );
    }
    return (
      <Typography
        component="div"
        className="pf-v6-u-mt-xs"
        sx={sectionDescriptionSx}
      >
        {modalToolsEmptyText}
      </Typography>
    );
  };

  const enabledSwitch = (
    <Switch
      id="mcp-configure-enabled-switch"
      aria-label={t('mcp.settings.toggleServerAriaLabel' as any, {
        serverName: editingServer?.name ?? '',
      })}
      isChecked={isModalEnabledChecked}
      isDisabled={isModalEnabledToggleDisabled}
      onChange={onModalEnabledChange}
    />
  );

  return (
    <StyledModal
      variant="small"
      width={608}
      isOpen={isOpen}
      onClose={close}
      aria-labelledby="mcp-configure-modal"
      aria-describedby="mcp-configure-modal-body"
    >
      <ModalHeader
        title={configureModalTitle}
        labelId="mcp-configure-modal"
        descriptorId="mcp-configure-modal-body"
      />
      <ModalCloseButton
        variant="plain"
        icon={<TimesIcon />}
        aria-label={t('mcp.settings.closeConfigureModalAriaLabel')}
        onClick={close}
      />
      <ModalBody id="mcp-configure-modal-body">
        <Stack hasGutter>
          <StackItem>
            <ModalInfoAlert
              variant="custom"
              customIcon={<InfoCircleIcon />}
              title={t('mcp.settings.modalDescription')}
              isInline
            />
          </StackItem>
          {editingServer?.auth === 'dcr' && (
            <StackItem>
              <ModalInfoAlert
                variant="custom"
                customIcon={<InfoCircleIcon />}
                title={t('mcp.settings.modalDescriptionDcr')}
                isInline
              />
            </StackItem>
          )}
          {hasRemovedPersonalToken && !editingServer?.hasOrgToken && (
            <StackItem>
              <ModalInfoAlert
                variant="custom"
                customIcon={<InfoCircleIcon />}
                title={t('mcp.settings.modal.tokenRemovedWarning')}
                isInline
              />
            </StackItem>
          )}
          <StackItem>
            <Typography
              component="div"
              sx={sectionTitleSx}
              className="pf-v6-u-mb-sm"
            >
              {t('mcp.settings.status')}
            </Typography>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              spaceItems={{ default: 'spaceItemsSm' }}
            >
              <FlexItem>{renderStatusIcon()}</FlexItem>
              <FlexItem>
                <Typography component="span">{modalStatusText}</Typography>
              </FlexItem>
            </Flex>
          </StackItem>
          {modalVerifiedHasToken && modalDisplayStatus === 'ok' && (
            <StackItem>
              <Typography
                component="div"
                className="pf-v6-u-mb-sm"
                sx={sectionTitleSx}
              >
                {t('mcp.settings.modal.toolsHeading' as any, {
                  count: String(modalToolCount),
                })}
              </Typography>
              {renderToolsContent()}
            </StackItem>
          )}
          <StackItem>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem flex={{ default: 'flex_1' }}>
                <Typography
                  component="div"
                  className="pf-v6-u-mb-sm"
                  sx={sectionTitleSx}
                >
                  {t('mcp.settings.enabled')}
                </Typography>
                <Typography
                  component="div"
                  className="pf-v6-u-mt-xs"
                  sx={sectionDescriptionSx}
                >
                  {modalEnabledDescription}
                </Typography>
              </FlexItem>
              <FlexItem>
                {isModalEnabledToggleDisabled ? (
                  <Tooltip content={modalStatusDetail}>
                    <Typography component="span">{enabledSwitch}</Typography>
                  </Tooltip>
                ) : (
                  enabledSwitch
                )}
              </FlexItem>
            </Flex>
          </StackItem>
          {(showCredentialRadios || showPersonalTokenField) && (
            <StackItem>
              <Form>
                {showCredentialRadios && (
                  <FormGroup
                    role="radiogroup"
                    id="mcp-credential-mode"
                    fieldId="mcp-credential-mode"
                    label={t('mcp.settings.modal.authenticationHeading')}
                  >
                    <Stack hasGutter>
                      <StackItem>
                        <Radio
                          id="mcp-credential-organization"
                          name="mcp-credential-mode"
                          label={t(
                            'mcp.settings.modal.credentialMode.organization',
                          )}
                          isChecked={modalCredentialMode === 'organization'}
                          onChange={() =>
                            onCredentialModeChange('organization')
                          }
                        />
                        <Typography
                          component="div"
                          className="pf-v6-u-ml-xl pf-v6-u-mt-xs"
                          sx={credentialRadioDescriptionSx}
                        >
                          {t(
                            'mcp.settings.modal.credentialMode.organizationDescription',
                          )}
                        </Typography>
                      </StackItem>
                      <StackItem>
                        <Radio
                          id="mcp-credential-personal"
                          name="mcp-credential-mode"
                          label={t(
                            'mcp.settings.modal.credentialMode.personal',
                          )}
                          isChecked={modalCredentialMode === 'personal'}
                          onChange={() => onCredentialModeChange('personal')}
                        />
                      </StackItem>
                    </Stack>
                  </FormGroup>
                )}
                {showPersonalTokenField && (
                  <FormGroup
                    label={t('mcp.settings.authenticationToken')}
                    fieldId="mcp-pat-input"
                  >
                    <TextInputGroup validated={tokenInputValidated}>
                      <TextInputGroupMain
                        inputId="mcp-pat-input"
                        type="password"
                        value={tokenInputValue}
                        onChange={(_event, value) => onTokenInputChange(value)}
                      />
                      {(tokenValidationState === 'idle' ||
                        tokenValidationState === 'validating') && (
                        <TextInputGroupUtilities>
                          <Button
                            variant="plain"
                            onClick={clearTokenInput}
                            aria-label={t('mcp.settings.token.clearAriaLabel')}
                            icon={<TimesIcon />}
                          />
                        </TextInputGroupUtilities>
                      )}
                    </TextInputGroup>
                    {showTokenHelperText && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant={tokenHelperVariant}>
                            {tokenHelperText}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </Form>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void save()}
          isDisabled={
            !canManageMcp ||
            isConfigureModalSaving ||
            tokenValidationState === 'validating' ||
            isSaveTokenButtonDisabled ||
            isUpdatingModalStatus
          }
        >
          {t('modal.save')}
        </Button>
        {canRemovePersonalToken && (
          <RemovePersonalTokenButton
            variant="secondary"
            isDanger
            onClick={() => void removePersonalToken()}
            isDisabled={
              !canManageMcp ||
              isConfigureModalSaving ||
              tokenValidationState === 'validating' ||
              isUpdatingModalStatus ||
              hasRemovedPersonalToken ||
              !hasSavedTokenInModal
            }
          >
            {t('mcp.settings.removePersonalToken')}
          </RemovePersonalTokenButton>
        )}
        <Button variant="link" onClick={close}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </StyledModal>
  );
};
