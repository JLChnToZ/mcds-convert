"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const js_yaml_1 = require("js-yaml");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const path_1 = require("path");
const fs_1 = require("fs");
const util_1 = require("util");
const readFileAsync = util_1.promisify(fs_1.readFile);
const writeFileAsync = util_1.promisify(fs_1.writeFile);
const namespacedIdPattern = /^(\#?)([a-z0-9_-]+\:)?([a-z0-9_-]*)((?:\/[a-z0-9_-]+)*)$/;
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
    return path;
}
async function pack(input, output) {
    const originalDir = process.cwd();
    process.chdir(path_1.dirname(input));
    if (!output)
        output = path_1.join(path_1.dirname(input), path_1.basename(input, path_1.extname(input)) + '.zip');
    let isYaml = false;
    switch (path_1.extname(input).toLowerCase()) {
        case '.yml':
        case '.yaml':
            isYaml = true;
            break;
    }
    const raw = await readFileAsync(input, 'utf8');
    const data = isYaml ? js_yaml_1.load(raw) : JSON.parse(raw);
    var zipFile = new jszip_1.default();
    zipFile.file('pack.mcmeta', JSON.stringify({ pack: data.pack }));
    for (const key of Object.keys(data)) {
        switch (key) {
            case 'pack':
                break;
            default: {
                const content = data[key];
                for (const nsid of Object.keys(content)) {
                    const path = namespacedIdToPath(nsid, key);
                    switch (key) {
                        case 'structures':
                            zipFile.file(`${path}.nbt`, (await node_fetch_1.default(content[nsid])).buffer());
                            break;
                        case 'functions':
                            if (nsid.charAt(0) !== '#') {
                                zipFile.file(`${path}.mcfunction`, Array.isArray(content[nsid]) ?
                                    content[nsid].join('\n') :
                                    content[nsid].toString());
                                break;
                            }
                        default:
                            zipFile.file(`${path}.json`, JSON.stringify(content[nsid]));
                            break;
                    }
                }
            }
        }
    }
    await writeFileAsync(path_1.resolve(originalDir, output), await zipFile.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    }));
}
exports.pack = pack;
