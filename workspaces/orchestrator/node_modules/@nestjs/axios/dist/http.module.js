"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var HttpModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpModule = void 0;
const common_1 = require("@nestjs/common");
const random_string_generator_util_1 = require("@nestjs/common/utils/random-string-generator.util");
const axios_1 = __importDefault(require("axios"));
const http_constants_1 = require("./http.constants");
const http_service_1 = require("./http.service");
let HttpModule = HttpModule_1 = class HttpModule {
    static register(config) {
        return {
            module: HttpModule_1,
            global: config.global,
            providers: [
                {
                    provide: http_constants_1.AXIOS_INSTANCE_TOKEN,
                    useValue: axios_1.default.create(config),
                },
                {
                    provide: http_constants_1.HTTP_MODULE_ID,
                    useValue: (0, random_string_generator_util_1.randomStringGenerator)(),
                },
            ],
        };
    }
    static registerAsync(options) {
        return {
            module: HttpModule_1,
            global: options.global,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options),
                {
                    provide: http_constants_1.AXIOS_INSTANCE_TOKEN,
                    useFactory: (config) => axios_1.default.create(config),
                    inject: [http_constants_1.HTTP_MODULE_OPTIONS],
                },
                {
                    provide: http_constants_1.HTTP_MODULE_ID,
                    useValue: (0, random_string_generator_util_1.randomStringGenerator)(),
                },
                ...(options.extraProviders || []),
            ],
        };
    }
    static createAsyncProviders(options) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass,
            },
        ];
    }
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: http_constants_1.HTTP_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        return {
            provide: http_constants_1.HTTP_MODULE_OPTIONS,
            useFactory: async (optionsFactory) => optionsFactory.createHttpOptions(),
            inject: [options.useExisting || options.useClass],
        };
    }
};
exports.HttpModule = HttpModule;
exports.HttpModule = HttpModule = HttpModule_1 = __decorate([
    (0, common_1.Module)({
        providers: [
            http_service_1.HttpService,
            {
                provide: http_constants_1.AXIOS_INSTANCE_TOKEN,
                useValue: axios_1.default,
            },
        ],
        exports: [http_service_1.HttpService],
    })
], HttpModule);
