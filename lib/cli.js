"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("source-map-support/register");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const _1 = require("./");
yargs_1.default
    .command(['pack <file> [out]', 'p'], 'Pack as zip file', y => y.positional('file', {
    describe: 'input file',
    type: 'string',
    demandOption: true,
}).positional('out', {
    describe: 'Output file',
    type: 'string',
}), argv => _1.pack(argv.file, argv.out).catch(logError))
    .command(['unpack <file> [out]', 'u'], 'Unpack a zip file to single definition', y => y.positional('file', {
    describe: 'input file',
    type: 'string',
    demandOption: true,
}).positional('out', {
    describe: 'Output file',
    type: 'string',
}), argv => _1.unpack(argv.file, argv.out).catch(logError))
    .demandCommand(1)
    .help()
    .parse();
function logError(error) {
    console.error('An error occured!');
    console.error(error && typeof error === 'object' ? error.stack || error : error);
}
//# sourceMappingURL=cli.js.map