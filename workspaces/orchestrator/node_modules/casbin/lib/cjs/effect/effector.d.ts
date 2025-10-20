import { EffectorStream } from './effectorStream';
export declare enum Effect {
    Allow = 1,
    Indeterminate = 2,
    Deny = 3
}
export interface Effector {
    newStream(expr: string): EffectorStream;
}
