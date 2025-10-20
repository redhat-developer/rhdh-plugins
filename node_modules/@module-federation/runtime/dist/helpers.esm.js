import { o as getRegisteredShare, y as getGlobalShareScope, G as Global, I as nativeGlobal, J as resetFederationGlobalInfo, C as getGlobalFederationInstance, F as setGlobalFederationInstance, E as getGlobalFederationConstructor, B as setGlobalFederationConstructor, m as getInfoWithoutType, u as getGlobalSnapshot, K as getTargetSnapshotInfoByModuleInfo, q as getGlobalSnapshotInfoByModuleInfo, t as setGlobalSnapshotInfoByModuleInfo, r as addGlobalSnapshot, c as getRemoteEntryExports, H as registerGlobalPlugins, g as getGlobalHostPlugins, n as getPreloaded, s as setPreloaded } from './share.esm.js';
import './polyfills.esm.js';
import '@module-federation/sdk';

const ShareUtils = {
    getRegisteredShare,
    getGlobalShareScope
};
const GlobalUtils = {
    Global,
    nativeGlobal,
    resetFederationGlobalInfo,
    getGlobalFederationInstance,
    setGlobalFederationInstance,
    getGlobalFederationConstructor,
    setGlobalFederationConstructor,
    getInfoWithoutType,
    getGlobalSnapshot,
    getTargetSnapshotInfoByModuleInfo,
    getGlobalSnapshotInfoByModuleInfo,
    setGlobalSnapshotInfoByModuleInfo,
    addGlobalSnapshot,
    getRemoteEntryExports,
    registerGlobalPlugins,
    getGlobalHostPlugins,
    getPreloaded,
    setPreloaded
};
var helpers = {
    global: GlobalUtils,
    share: ShareUtils
};

export { helpers as default };
