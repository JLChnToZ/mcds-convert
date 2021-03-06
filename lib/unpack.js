"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpackToFile = exports.unpack = void 0;
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const utils_1 = require("./utils");
async function unpack(inputData, options) {
    var _a;
    const zipFile = await jszip_1.default.loadAsync(inputData);
    const result = {};
    const raw = await ((_a = zipFile.file('pack.mcmeta')) === null || _a === void 0 ? void 0 : _a.async('string'));
    if (raw == null)
        throw new Error('`pack.mcmeta` does not exists at root.');
    Object.assign(result, JSON.parse(raw));
    const co = [];
    for (const file of Object.keys(zipFile.files)) {
        const splittedFile = file.split('/');
        const fileName = splittedFile[splittedFile.length - 1];
        if (splittedFile.length === 1 && fileName === 'pack.mcmeta')
            continue;
        if (splittedFile.length > 2 && splittedFile[0] === 'data') {
            const nsidType = utils_1.pathToNamespacedId(splittedFile);
            if (!nsidType)
                continue;
            const { nsid, type } = nsidType;
            if (!type || !nsid)
                continue;
            if (!result[type])
                result[type] = {};
            const ext = path_1.extname(fileName);
            switch (type) {
                case 'structures':
                    if (ext === '.nbt' && options.nbt)
                        co.push(utils_1.resolveTo(unpackNBT(zipFile, file, options), result[type], nsid));
                    break;
                case 'functions':
                    if (nsid[0] !== '#' && ext === '.mcfunction') {
                        co.push(utils_1.resolveTo(unpackMCFunction(zipFile, file, options), result[type], nsid));
                        break;
                    }
                default:
                    if (ext === '.json')
                        co.push(utils_1.resolveTo(unpackJSON(zipFile, file), result[type], nsid));
                    break;
            }
        }
    }
    await Promise.all(co);
    return options.yaml ? js_yaml_1.dump(result, {
        lineWidth: options.lineWidth,
        condenseFlow: !options.pretty,
    }) : JSON.stringify(result, null, options.pretty ? 2 : 0);
}
exports.unpack = unpack;
async function unpackNBT(zipFile, file, options) {
    return options.snbt ?
        utils_1.nbtToSnbt(zipFile.files[file].async('nodebuffer'), options.pretty, options.yaml && options.lineWidth != null ? options.lineWidth - 20 : undefined) :
        options.yaml ?
            zipFile.files[file].async('nodebuffer') :
            `data:application/x-minecraft-nbt;base64,${await zipFile.files[file].async('base64')}`;
}
async function unpackMCFunction(zipFile, file, options) {
    const result = await zipFile.files[file].async('string');
    return options.yaml ? result : result.split(/[\r\n]+/);
}
async function unpackJSON(zipFile, file) {
    return JSON.parse(await zipFile.files[file].async('string'));
}
async function unpackToFile(options) {
    const opt = Object.assign({}, options);
    opt.input = path_1.resolve(opt.input);
    opt.output = options.output || path_1.join(path_1.dirname(opt.input), path_1.basename(opt.input, path_1.extname(opt.input)) + (opt.yaml === false ? '.json' : '.yml'));
    if (options.yaml == null)
        switch (path_1.extname(opt.output).toLowerCase()) {
            case '.yml':
            case '.yaml':
                opt.yaml = true;
                break;
        }
    console.error(`Start parse ${opt.input}.`);
    await utils_1.writeFileAsync(opt.output, await unpack(await utils_1.readFileAsync(opt.input), opt));
    console.error(`Successfully write into ${opt.output}.`);
}
exports.unpackToFile = unpackToFile;
//# sourceMappingURL=unpack.js.map