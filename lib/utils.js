"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTo = exports.queuePromise = exports.debounce = exports.logError = exports.resolveResource = exports.nbtToSnbt = exports.isGZip = exports.streamToBuffer = exports.streamToArray = exports.fetch = exports.tryParseURL = exports.decode = exports.fileUrl = exports.namespacedIdToPath = exports.pathToNamespacedId = exports.gzipAsync = exports.gunzipAsync = exports.existsAsync = exports.writeFileAsync = exports.readFileAsync = void 0;
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const path_1 = require("path");
const nbt_ts_1 = require("nbt-ts");
const util_1 = require("util");
const iconv_lite_1 = require("iconv-lite");
const http_1 = require("http");
const https_1 = require("https");
const url_1 = require("url");
const timers_1 = require("timers");
exports.readFileAsync = util_1.promisify(fs_1.readFile);
exports.writeFileAsync = util_1.promisify(fs_1.writeFile);
exports.existsAsync = util_1.promisify(fs_1.exists);
exports.gunzipAsync = util_1.promisify(zlib_1.gunzip);
exports.gzipAsync = util_1.promisify(zlib_1.gzip);
const defaultNamespace = 'minecraft';
const extPattern = /\.[a-z0-9]+$/;
const namespacedIdPattern = /^(\#?)([\w-]+\:)?([\w-]*)((?:\/[\w-]+)*)$/;
const dataUriPattern = /^data:(\w+\/[-+.\w]+)?(?:;((?:charset=([\w-]+))|base64))?,(.*)/;
const absolutePathPrefixPattern = /^([a-z]:)?[\\\/]/i;
function pathToNamespacedId(pathSplitted) {
    let nsid = pathSplitted[1].toLowerCase() === defaultNamespace ? '' : `${pathSplitted[1]}:`;
    let type = pathSplitted[2];
    switch (type) {
        case 'tags':
            if (pathSplitted.length < 5)
                return;
            nsid = `#${nsid}${pathSplitted.slice(4).join('/')}`;
            type = pathSplitted[3];
            break;
        case 'worldgen':
            if (pathSplitted.length < 5)
                return;
            nsid += pathSplitted.slice(4).join('/');
            type += `/${pathSplitted[3]}`;
            break;
        default:
            nsid += pathSplitted.slice(3).join('/');
            break;
    }
    nsid = nsid.replace(extPattern, '');
    if (nsid[nsid.length - 1] === ':')
        nsid = nsid.substring(0, nsid.length - 1);
    nsid = nsid.toLowerCase();
    return { type, nsid };
}
exports.pathToNamespacedId = pathToNamespacedId;
function namespacedIdToPath(nsid, type) {
    const m = namespacedIdPattern.exec(nsid);
    if (!m)
        throw new TypeError('Invalid Namespaced ID');
    let path = 'data/';
    path += m[2] ? m[2].substring(0, m[2].length - 1) : defaultNamespace;
    if (m[1])
        path += '/tags';
    path += `/${type}`;
    if (m[3])
        path += `/${m[3]}`;
    if (m[4])
        path += m[4];
    return path.toLowerCase();
}
exports.namespacedIdToPath = namespacedIdToPath;
function fileUrl(filePath, base) {
    if (typeof filePath !== 'string')
        throw new Error('Filepath should be string');
    let pathName = (base ? path_1.resolve(base, filePath) : path_1.resolve(filePath)).replace(/\\/g, '/');
    if (pathName[0] !== '/')
        pathName = `/${pathName}`;
    return encodeURI(`file://${pathName}`);
}
exports.fileUrl = fileUrl;
function decode(uri) {
    const result = dataUriPattern.exec(uri.replace(/[\r\n\s]+/g, ''));
    return result && Object.assign(iconv_lite_1.encode(decodeURI(result[4]), result[2] === 'base64' ? 'base64' :
        (result[3] || 'ascii')), {
        type: result[1],
    });
}
exports.decode = decode;
function tryParseURL(url, base) {
    if (!url)
        throw new TypeError('Url is not provided.');
    return url instanceof url_1.URL ? url :
        decode(url) || (absolutePathPrefixPattern.test(url) ?
            new url_1.URL(fileUrl(url)) :
            new url_1.URL(url, fileUrl(base || process.cwd())));
}
exports.tryParseURL = tryParseURL;
function fetch(url) {
    try {
        switch (url.protocol) {
            case 'file:':
                return exports.readFileAsync(url);
            case 'http:':
                return new Promise((resolve, reject) => http_1.get(url, resolve).on('error', reject)).then(streamToBuffer);
            case 'https:':
                return new Promise((resolve, reject) => https_1.get(url, resolve).on('error', reject)).then(streamToBuffer);
            default:
                throw new TypeError('Unsupported protocol.');
        }
    }
    catch (err) {
        return Promise.reject(err);
    }
}
exports.fetch = fetch;
function streamToArray(stream) {
    return new Promise((resolve, reject) => {
        const data = [];
        stream.on('data', Array.prototype.push.bind(data))
            .on('end', () => resolve(data))
            .on('error', reject);
    });
}
exports.streamToArray = streamToArray;
function streamToBuffer(stream) {
    return streamToArray(stream).then(Buffer.concat);
}
exports.streamToBuffer = streamToBuffer;
function isGZip(data) {
    return data != null &&
        data.length >= 3 &&
        data[0] === 0x1F &&
        data[1] === 0x8B &&
        data[2] === 0x08;
}
exports.isGZip = isGZip;
async function nbtToSnbt(data, pretty, breakLength, quote = 'single') {
    const dataBuf = await data;
    const rawData = isGZip(dataBuf) ? await exports.gunzipAsync(dataBuf) : dataBuf;
    return nbt_ts_1.stringify(nbt_ts_1.decode(rawData).value, { pretty, breakLength, quote });
}
exports.nbtToSnbt = nbtToSnbt;
function resolveResource(data, base, onPathDiscovered) {
    if (Buffer.isBuffer(data))
        return Promise.resolve(data);
    try {
        if (typeof data === 'string' && /^[\s\r\n]*\{/.test(data))
            return exports.gzipAsync(nbt_ts_1.encode('root', nbt_ts_1.parse(data)));
    }
    catch (_a) { }
    try {
        const result = tryParseURL(data, base);
        if (!(result instanceof url_1.URL))
            return Promise.resolve(result);
        onPathDiscovered === null || onPathDiscovered === void 0 ? void 0 : onPathDiscovered(result);
        return fetch(result);
    }
    catch (_b) { }
    try {
        return Promise.resolve(Buffer.from(data));
    }
    catch (e) {
        return Promise.reject(e);
    }
}
exports.resolveResource = resolveResource;
function logError(error) {
    console.error('An error occured!');
    console.error(error && typeof error === 'object' ? error.stack || error : error);
}
exports.logError = logError;
function debounce(fn, delay) {
    let timer;
    function callback(thisArg, args) {
        timer = undefined;
        fn.apply(thisArg, args);
    }
    return function (...args) {
        if (timer)
            clearTimeout(timer);
        timer = timers_1.setTimeout(callback, delay, this, args).unref();
    };
}
exports.debounce = debounce;
function queuePromise(fn) {
    let lastResult = Promise.resolve();
    return function (...args) {
        const callback = () => fn.apply(this, args);
        return lastResult = lastResult.then(callback, callback);
    };
}
exports.queuePromise = queuePromise;
async function resolveTo(src, target, key) {
    target[key] = await src;
}
exports.resolveTo = resolveTo;
//# sourceMappingURL=utils.js.map