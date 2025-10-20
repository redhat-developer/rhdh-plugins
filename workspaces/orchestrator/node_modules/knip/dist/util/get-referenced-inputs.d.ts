import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import { type Input } from './input.js';
export declare const getReferencedInputsHandler: (collector: IssueCollector, deputy: DependencyDeputy, chief: ConfigurationChief, isGitIgnored: (s: string) => boolean) => (input: Input, workspace: Workspace) => string | undefined;
