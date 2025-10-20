import { Effector } from './effector';
import { EffectorStream } from './effectorStream';
/**
 * DefaultEffector is default effector for Casbin.
 */
export declare class DefaultEffector implements Effector {
    newStream(expr: string): EffectorStream;
}
