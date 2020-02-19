"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const fs_1 = require("fs");
const util_1 = require("util");
const readFileAsync = util_1.promisify(fs_1.readFile);
const writeFileAsync = util_1.promisify(fs_1.writeFile);
const extMatcher = /\.[a-z0-9]+$/;
function pathToNamespaceID(pathSplitted) {
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
    nsid = nsid.replace(extMatcher, '');
    if (nsid[nsid.length - 1] === ':')
        nsid = nsid.substring(0, nsid.length - 1);
    return { type, nsid };
}
async function unpack(input, output) {
    if (!output)
        output = path_1.join(path_1.dirname(input), path_1.basename(input, path_1.extname(input)) + '.json');
    let isYaml = false;
    switch (path_1.extname(output).toLowerCase()) {
        case '.yml':
        case '.yaml':
            isYaml = true;
            break;
    }
    const zipFile = await jszip_1.default.loadAsync(await readFileAsync(input));
    const result = {};
    Object.assign(result, JSON.parse(await zipFile.file('pack.mcmeta').async('string')));
    for (const file of Object.keys(zipFile.files)) {
        const splittedFile = file.split('/');
        const fileName = splittedFile[splittedFile.length - 1];
        if (splittedFile.length === 1 && fileName === 'pack.mcmeta')
            continue;
        if (splittedFile.length > 2 && splittedFile[0] === 'data') {
            const nsidType = pathToNamespaceID(splittedFile);
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
                        result[type][nsid] = `data:application/octet-stream;base64,${await zipFile.files[file].async('base64')}`;
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
    await writeFileAsync(output, isYaml ? js_yaml_1.dump(result) : JSON.stringify(result, null, 2));
}
exports.unpack = unpack;
