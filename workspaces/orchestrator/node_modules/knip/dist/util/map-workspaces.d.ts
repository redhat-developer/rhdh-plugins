import type { WorkspacePackage } from '../types/package-json.js';
type Packages = Map<string, WorkspacePackage>;
type WorkspacePkgNames = Set<string>;
export default function mapWorkspaces(cwd: string, workspaces: string[]): Promise<[Packages, WorkspacePkgNames]>;
export {};
