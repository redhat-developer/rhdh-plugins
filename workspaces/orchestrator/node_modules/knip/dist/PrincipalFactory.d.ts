import { ProjectPrincipal } from './ProjectPrincipal.js';
import type { PrincipalOptions } from './types/project.js';
type Principal = {
    principal: ProjectPrincipal;
    wsDirs: Set<string>;
    pathKeys: Set<string>;
    pkgNames: Set<string>;
};
type Principals = Set<Principal>;
export declare class PrincipalFactory {
    principals: Principals;
    createPrincipal(options: PrincipalOptions): ProjectPrincipal;
    private findReusablePrincipal;
    private linkPrincipal;
    private addNewPrincipal;
    getPrincipals(): ProjectPrincipal[];
    getPrincipalByPackageName(packageName: string): ProjectPrincipal | undefined;
    deletePrincipal(principal: ProjectPrincipal): void;
}
export {};
