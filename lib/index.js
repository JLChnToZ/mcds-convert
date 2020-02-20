"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("source-map-support/register");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const pack_1 = require("./pack");
const unpack_1 = require("./unpack");
if (require.main === module)
    yargs_1.default
        .command(['pack <file> [out]', 'p'], 'Pack as zip file', y => y.positional('file', {
        describe: 'input file',
        type: 'string',
        demandOption: true,
    }).positional('out', {
        describe: 'Output file',
        type: 'string',
    }), argv => pack_1.pack(argv.file, argv.out))
        .command(['unpack <file> [out]', 'u'], 'Unpack a zip file to single definition', y => y.positional('file', {
        describe: 'input file',
        type: 'string',
        demandOption: true,
    }).positional('out', {
        describe: 'Output file',
        type: 'string',
    }), argv => unpack_1.unpack(argv.file, argv.out))
        .demandCommand(1)
        .help()
        .parse();
var pack_2 = require("./pack");
exports.pack = pack_2.pack;
var unpack_2 = require("./unpack");
exports.unpack = unpack_2.unpack;
//# sourceMappingURL=index.js.map