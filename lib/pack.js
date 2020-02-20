"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const utils_1 = require("./utils");
async function pack(input, output) {
    const originalDir = process.cwd();
    input = path_1.resolve(input);
    process.chdir(path_1.dirname(input));
    if (!output)
        output = path_1.resolve(path_1.basename(input, path_1.extname(input)) + '.zip');
    let isYaml = false;
    switch (path_1.extname(input).toLowerCase()) {
        case '.yml':
        case '.yaml':
            isYaml = true;
            break;
    }
    const raw = await utils_1.readFileAsync(input, 'utf8');
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
                    const path = utils_1.namespacedIdToPath(nsid, key);
                    switch (key) {
                        case 'structures':
                            zipFile.file(`${path}.nbt`, await utils_1.resolveResource(content[nsid]));
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
    await utils_1.writeFileAsync(path_1.resolve(originalDir, output), await zipFile.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    }));
}
exports.pack = pack;
//# sourceMappingURL=pack.js.map