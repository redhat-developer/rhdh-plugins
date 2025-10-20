declare const CONSTANTS: Readonly<{
    readonly CHARSET_DEFAULT: "utf-8";
    readonly EXTENSIONS_PREFIX: "ce-";
    readonly ENCODING_BASE64: "base64";
    readonly DATA_ATTRIBUTE: "data";
    readonly MIME_JSON: "application/json";
    readonly MIME_OCTET_STREAM: "application/octet-stream";
    readonly MIME_CE: "application/cloudevents";
    readonly MIME_CE_JSON: "application/cloudevents+json";
    readonly MIME_CE_BATCH: "application/cloudevents-batch+json";
    readonly HEADER_CONTENT_TYPE: "content-type";
    readonly DEFAULT_CONTENT_TYPE: "application/json; charset=utf-8";
    readonly DEFAULT_CE_CONTENT_TYPE: "application/cloudevents+json; charset=utf-8";
    readonly CE_HEADERS: {
        readonly TYPE: "ce-type";
        readonly SPEC_VERSION: "ce-specversion";
        readonly SOURCE: "ce-source";
        readonly ID: "ce-id";
        readonly TIME: "ce-time";
        readonly SUBJECT: "ce-subject";
    };
    readonly CE_ATTRIBUTES: {
        readonly ID: "id";
        readonly TYPE: "type";
        readonly SOURCE: "source";
        readonly SPEC_VERSION: "specversion";
        readonly TIME: "time";
        readonly CONTENT_TYPE: "datacontenttype";
        readonly SUBJECT: "subject";
        readonly DATA: "data";
    };
    readonly BINARY_HEADERS_03: {
        readonly SCHEMA_URL: "ce-schemaurl";
        readonly CONTENT_ENCODING: "ce-datacontentencoding";
    };
    readonly STRUCTURED_ATTRS_03: {
        readonly SCHEMA_URL: "schemaurl";
        readonly CONTENT_ENCODING: "datacontentencoding";
    };
    readonly BINARY_HEADERS_1: {
        readonly DATA_SCHEMA: "ce-dataschema";
    };
    readonly STRUCTURED_ATTRS_1: {
        readonly DATA_SCHEMA: "dataschema";
        readonly DATA_BASE64: "data_base64";
    };
    readonly USE_BIG_INT_ENV: "CE_USE_BIG_INT";
}>;
export default CONSTANTS;
