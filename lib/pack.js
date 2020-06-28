"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packToFile = exports.pack = void 0;
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const chokidar_1 = require("chokidar");
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const utils_1 = require("./utils");
const url_1 = require("url");
async function pack(raw, options) {
    const data = options.yaml ? js_yaml_1.load(raw, { filename: options.input }) : JSON.parse(raw);
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
                            zipFile.file(`${path}.nbt`, utils_1.resolveResource(content[nsid], options.base, options.urlDiscoverCb));
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
    return zipFile.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    });
}
exports.pack = pack;
async function packToFile(options) {
    const opt = Object.assign({}, options);
    opt.input = options.base ? path_1.resolve(options.base, options.input) : path_1.resolve(options.input);
    if (!options.base)
        opt.base = path_1.dirname(opt.input);
    const inputExt = path_1.extname(opt.input);
    opt.output = path_1.resolve(options.output || path_1.basename(opt.input, inputExt) + '.zip');
    switch (inputExt.toLowerCase()) {
        case '.yml':
        case '.yaml':
            opt.yaml = true;
            break;
        default:
            opt.yaml = false;
            break;
    }
    if (options.watch) {
        console.error('Watch mode enabled!');
        opt.watcher = chokidar_1.watch(opt.input, {
            ignoreInitial: true,
        }).on('change', utils_1.debounce(utils_1.queuePromise(() => packToFileExec(opt).catch(utils_1.logError)), 1000));
        opt.urlDiscoverCb = url => {
            var _a;
            if (url.protocol === 'file')
                (_a = opt.watcher) === null || _a === void 0 ? void 0 : _a.add(url_1.fileURLToPath(url));
        };
    }
    await packToFileExec(opt);
}
exports.packToFile = packToFile;
async function packToFileExec(options) {
    console.error(`Start parse ${options.input}.`);
    await utils_1.writeFileAsync(options.output, await pack(await utils_1.readFileAsync(options.input, 'utf8'), options));
    console.error(`Successfully write into ${options.output}.`);
}
//# sourceMappingURL=pack.js.map