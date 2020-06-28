"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("source-map-support/register");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const pack_1 = require("./pack");
const unpack_1 = require("./unpack");
const utils_1 = require("./utils");
yargs_1.default
    .command(['pack <file> [out]', 'p'], 'Pack as zip file', y => y.positional('file', {
    describe: 'input file',
    type: 'string',
    demandOption: true,
}).positional('out', {
    describe: 'Output file',
    type: 'string',
}).options({
    watch: {
        alias: 'w',
        describe: 'Watch file changes',
        type: 'boolean',
        default: false,
    },
}), argv => pack_1.packToFile({
    input: argv.file,
    output: argv.out,
    watch: argv.watch,
}).catch(utils_1.logError))
    .command(['unpack <file> [out]', 'u'], 'Unpack a zip file to single definition', y => y.positional('file', {
    describe: 'input file',
    type: 'string',
    demandOption: true,
}).positional('out', {
    describe: 'Output file',
    type: 'string',
}).options({
    linemax: {
        alias: 'l',
        describe: 'Max characters per line',
        type: 'number',
    },
    snbt: {
        alias: 's',
        describe: 'Extract NBT binaries to SNBT',
        default: false,
        type: 'boolean',
    },
    nbt: {
        alias: 'n',
        describe: 'Extract NBT files',
        default: true,
        type: 'boolean',
    },
    pretty: {
        alias: 'p',
        describe: 'Prettify output',
        default: true,
        type: 'boolean',
    },
}), argv => unpack_1.unpackToFile({
    input: argv.file,
    output: argv.out,
    lineWidth: argv.linemax,
    nbt: argv.nbt,
    snbt: argv.snbt,
    pretty: argv.pretty,
}).catch(utils_1.logError))
    .demandCommand(1)
    .help()
    .parse();
//# sourceMappingURL=cli.js.map