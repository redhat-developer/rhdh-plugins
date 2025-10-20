import { Enforcer } from './enforcer';
/**
 * Experiment!
 * getPermissionForCasbinJs returns a string include the whole model.
 * You can pass the returned string to the frontend and manage your webpage widgets and APIs with Casbin.js.
 * @param e the initialized enforcer
 * @param user the user
 */
export declare function casbinJsGetPermissionForUser(e: Enforcer, user?: string): Promise<string>;
