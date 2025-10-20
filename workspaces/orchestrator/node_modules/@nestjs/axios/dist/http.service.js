"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const rxjs_1 = require("rxjs");
const http_constants_1 = require("./http.constants");
let HttpService = class HttpService {
    constructor(instance = axios_1.default) {
        this.instance = instance;
    }
    request(config) {
        return this.makeObservable(this.instance.request, config);
    }
    get(url, config) {
        return this.makeObservable(this.instance.get, url, config);
    }
    delete(url, config) {
        return this.makeObservable(this.instance.delete, url, config);
    }
    head(url, config) {
        return this.makeObservable(this.instance.head, url, config);
    }
    post(url, data, config) {
        return this.makeObservable(this.instance.post, url, data, config);
    }
    put(url, data, config) {
        return this.makeObservable(this.instance.put, url, data, config);
    }
    patch(url, data, config) {
        return this.makeObservable(this.instance.patch, url, data, config);
    }
    postForm(url, data, config) {
        return this.makeObservable(this.instance.postForm, url, data, config);
    }
    putForm(url, data, config) {
        return this.makeObservable(this.instance.putForm, url, data, config);
    }
    patchForm(url, data, config) {
        return this.makeObservable(this.instance.patchForm, url, data, config);
    }
    get axiosRef() {
        return this.instance;
    }
    makeObservable(axios, ...args) {
        return new rxjs_1.Observable(subscriber => {
            const argsCopy = [...args];
            const configIdx = argsCopy.length - 1;
            const config = { ...(argsCopy[configIdx] || {}) };
            argsCopy[configIdx] = config;
            let cancelSource;
            if (!config.cancelToken) {
                cancelSource = axios_1.default.CancelToken.source();
                config.cancelToken = cancelSource.token;
            }
            axios(...argsCopy)
                .then(res => {
                subscriber.next(res);
                subscriber.complete();
            })
                .catch(err => {
                subscriber.error(err);
            });
            return () => {
                if (config.responseType === 'stream') {
                    return;
                }
                if (cancelSource) {
                    cancelSource.cancel();
                }
            };
        });
    }
};
exports.HttpService = HttpService;
exports.HttpService = HttpService = __decorate([
    __param(0, (0, common_1.Inject)(http_constants_1.AXIOS_INSTANCE_TOKEN)),
    __metadata("design:paramtypes", [Function])
], HttpService);
