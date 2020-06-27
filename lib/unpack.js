"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = void 0;
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const utils_1 = require("./utils");
async function unpack(input, output) {
    var _a;
    input = path_1.resolve(input);
    if (!output)
        output = path_1.join(path_1.dirname(input), path_1.basename(input, path_1.extname(input)) + '.json');
    let isYaml = false;
    switch (path_1.extname(output).toLowerCase()) {
        case '.yml':
        case '.yaml':
            isYaml = true;
            break;
    }
    const zipFile = await jszip_1.default.loadAsync(await utils_1.readFileAsync(input));
    const result = {};
    const raw = await ((_a = zipFile.file('pack.mcmeta')) === null || _a === void 0 ? void 0 : _a.async('string'));
    if (raw == null)
        throw new Error('`pack.mcmeta` does not exists at root.');
    Object.assign(result, JSON.parse(raw));
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
                    if (ext === '.nbt')
                        result[type][nsid] = isYaml ?
                            await zipFile.files[file].async('nodebuffer') :
                            `data:application/x-minecraft-nbt;base64,${await zipFile.files[file].async('base64')}`;
                    break;
                case 'functions':
                    if (nsid[0] !== '#' && ext === '.mcfunction') {
                        result[type][nsid] = await zipFile.files[file].async('string');
                        if (!isYaml)
                            result[type][nsid] = result[type][nsid].split(/[\r\n]+/);
                        break;
                    }
                default:
                    if (ext === '.json')
                        result[type][nsid] = JSON.parse(await zipFile.files[file].async('string'));
                    break;
            }
        }
    }
    await utils_1.writeFileAsync(output, isYaml ? js_yaml_1.dump(result) : JSON.stringify(result, null, 2));
}
exports.unpack = unpack;
//# sourceMappingURL=unpack.js.map