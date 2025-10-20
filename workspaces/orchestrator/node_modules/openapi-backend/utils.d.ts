import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { Operation } from './router';
type Document = OpenAPIV3_1.Document | OpenAPIV3.Document;
export default class OpenAPIUtils {
    /**
     * Finds the value for a given key (status code) in an object,
     * based on the OpenAPI specification for patterned field.
     * Returns the value in the 'obj' argument for which the key matches the 'statusCode' argument,
     * based on pattern matching, or undefined otherwise.
     * @param {number} statusCode The status code representing the key to match in 'obj' argument.
     * @param {Object.<string, *>} obj The object containing values referenced by possibly patterned status code key.
     * @returns {*}
     */
    static findStatusCodeMatch(statusCode: number, obj: {
        [patternedStatusCode: string]: any;
    }): any;
    /**
     * Finds the default most appropriate value in an object, based on the following rule
     * 1. check for a 20X res
     * 2. check for a 2XX res
     * 3. check for the "default" res
     * 4. pick first res code in list
     * Returns the value in the 'obj' argument.
     * @param {Object.<string, *>} obj The object containing values referenced by possibly patterned status code key.
     * @returns {{status: string, res: *}}
     */
    static findDefaultStatusCodeMatch(obj: {
        [patternedStatusCode: string]: any;
    }): {
        status: number;
        res: any;
    };
    /**
     * Get operationId, (or generate one) for an operation
     *
     * @static
     * @param {Operation<D>} operation
     * @returns {string} OperationId of the given operation
     * @memberof OpenAPIUtils
     */
    static getOperationId<D extends Document = Document>(operation: Operation<D>): string;
}
export {};
