/**
 * Wraps the ObjectSerializer to support custom resources and generic Kubernetes objects.
 */
declare class KubernetesObjectSerializer {
    private static _instance;
    static get instance(): KubernetesObjectSerializer;
    private constructor();
    serialize(data: any, type: string): any;
    deserialize(data: any, type: string): any;
}
declare const _default: KubernetesObjectSerializer;
export default _default;
