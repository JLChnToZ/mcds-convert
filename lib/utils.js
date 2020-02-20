"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const iconv_lite_1 = require("iconv-lite");
const http_1 = require("http");
const https_1 = require("https");
const url_1 = require("url");
exports.readFileAsync = util_1.promisify(fs_1.readFile);
exports.writeFileAsync = util_1.promisify(fs_1.writeFile);
exports.existsAsync = util_1.promisify(fs_1.exists);
const extPattern = /\.[a-z0-9]+$/;
const namespacedIdPattern = /^(\#?)([\w-]+\:)?([\w-]*)((?:\/[\w-]+)*)$/;
const dataUriPattern = /^data:(\w+\/[-+.\w]+)?(?:;((?:charset=([\w-]+))|base64))?,(.*)/;
const absolutePathPrefixPattern = /^([a-z]:)?[\\\/]/i;
function pathToNamespacedId(pathSplitted) {
    let nsid = pathSplitted[1] === 'minecraft' ? '' : `${pathSplitted[1]}:`;
    let type = pathSplitted[2];
    if (type === 'tags') {
        if (pathSplitted.length < 5)
            return;
        nsid = '#' + nsid + pathSplitted.slice(4).join('/');
        type = pathSplitted[3];
    }
    else
        nsid += pathSplitted.slice(3).join('/');
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
    path += m[2] ? m[2].substring(0, m[2].length - 1) : 'minecraft';
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
function fileUrl(filePath) {
    if (typeof filePath !== 'string')
        throw new Error('Filepath should be string');
    let pathName = path_1.resolve(filePath).replace(/\\/g, '/');
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
function fetch(url) {
    try {
        if (!url)
            throw new TypeError('Url is not provided.');
        let parsedUrl;
        if (typeof url === 'string') {
            const data = decode(url);
            if (data)
                return Promise.resolve(data);
            if (absolutePathPrefixPattern.test(url))
                parsedUrl = new url_1.URL(fileUrl(url));
            else
                parsedUrl = new url_1.URL(url, fileUrl(process.cwd()));
        }
        else
            parsedUrl = url;
        switch (parsedUrl.protocol) {
            case 'file:':
                return exports.readFileAsync(parsedUrl);
            case 'http:':
                return new Promise((resolve, reject) => http_1.get(parsedUrl, resolve).on('error', reject)).then(streamToBuffer);
            case 'https:':
                return new Promise((resolve, reject) => https_1.get(parsedUrl, resolve).on('error', reject)).then(streamToBuffer);
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
function resolveResource(data) {
    if (Buffer.isBuffer(data))
        return Promise.resolve(data);
    try {
        return fetch(data);
    }
    catch {
        return Promise.resolve(Buffer.from(data));
    }
}
exports.resolveResource = resolveResource;
//# sourceMappingURL=utils.js.map