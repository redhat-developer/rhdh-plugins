"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
class KubernetesObject {
}
KubernetesObject.attributeTypeMap = [
    {
        name: 'apiVersion',
        baseName: 'apiVersion',
        type: 'string',
    },
    {
        name: 'kind',
        baseName: 'kind',
        type: 'string',
    },
    {
        name: 'metadata',
        baseName: 'metadata',
        type: 'V1ObjectMeta',
    },
];
const isKubernetesObject = (data) => !!data && typeof data === 'object' && 'apiVersion' in data && 'kind' in data;
/**
 * Wraps the ObjectSerializer to support custom resources and generic Kubernetes objects.
 */
class KubernetesObjectSerializer {
    static get instance() {
        if (this._instance) {
            return this._instance;
        }
        this._instance = new KubernetesObjectSerializer();
        return this._instance;
    }
    constructor() { }
    serialize(data, type) {
        const obj = api_1.ObjectSerializer.serialize(data, type);
        if (obj !== data) {
            return obj;
        }
        if (!isKubernetesObject(data)) {
            return obj;
        }
        const instance = {};
        for (const attributeType of KubernetesObject.attributeTypeMap) {
            instance[attributeType.name] = api_1.ObjectSerializer.serialize(data[attributeType.baseName], attributeType.type);
        }
        // add all unknown properties as is.
        for (const [key, value] of Object.entries(data)) {
            if (KubernetesObject.attributeTypeMap.find((t) => t.name === key)) {
                continue;
            }
            instance[key] = value;
        }
        return instance;
    }
    deserialize(data, type) {
        const obj = api_1.ObjectSerializer.deserialize(data, type);
        if (obj !== data) {
            // the serializer knows the type and already deserialized it.
            return obj;
        }
        if (!isKubernetesObject(data)) {
            return obj;
        }
        const instance = new KubernetesObject();
        for (const attributeType of KubernetesObject.attributeTypeMap) {
            instance[attributeType.name] = api_1.ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type);
        }
        // add all unknown properties as is.
        for (const [key, value] of Object.entries(data)) {
            if (KubernetesObject.attributeTypeMap.find((t) => t.name === key)) {
                continue;
            }
            instance[key] = value;
        }
        return instance;
    }
}
exports.default = KubernetesObjectSerializer.instance;
//# sourceMappingURL=serializer.js.map