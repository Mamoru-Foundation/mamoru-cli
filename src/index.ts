#! /usr/bin/env node
import colors from 'colors'
import * as fs from 'fs'
import { program, InvalidArgumentError, Option } from 'commander'
import initCommand, { InitOptions } from './commands/init'
import codegenCommand from './commands/codegen'
import compileCommand from './commands/build'
import publishCommand, { PublishOptions } from './commands/publish'

function parseDirectoryPath(path: string) {
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
        return path
    } else {
        throw new InvalidArgumentError(
            'Provided path is not exist or not a folder.'
        )
    }
}

function parseOrSetCurrentDirectoryPath(path: string) {
    if (!path) {
        return '.'
    }
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
        return path
    } else {
        throw new InvalidArgumentError(
            'Provided path is not exist or not a folder.'
        )
    }
}

function parseOrCreateDirectoryPath(path: string) {
    if (path === '') {
        throw new InvalidArgumentError('Path is required.')
    }

    if (fs.existsSync(path) && !fs.lstatSync(path).isDirectory()) {
        throw new InvalidArgumentError('Provided path is not a folder.')
    }

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
        return path
    }

    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
        return path
    }

    throw new InvalidArgumentError(
        'Provided path is not exist or not a folder.'
    )
}

function increaseVerbosity(dummyValue: string, previous: number) {
    return previous + 1
}

program.option(
    '-v, --verbose',
    'define verbosity to show execution logs',
    increaseVerbosity,
    0
)

program
    .command('init')
    .argument(
        '<path>',
        'path to folder with queryable project',
        parseOrCreateDirectoryPath,
        ''
    )
    .addOption(
        new Option('-t, --type <type>', 'Type of project')
            .choices(['sql', 'wasm'])
            .default('wasm')
    )
    .addOption(
        new Option('-c, --chain <chain>', 'Chain where the daemon runs')
            .choices(['ethereum', 'bsc', 'sui'])
            .makeOptionMandatory()
    )
    .addOption(
        new Option('-n, --name <name>', 'Name of the project').default(
            'Default Name'
        )
    )
    .addOption(
        new Option(
            '-d, --description <description>',
            'Description of the project'
        ).default('Mamoru Daemon')
    )
    .addOption(
        new Option(
            '-t, --tags <tags>',
            'Tags of the project, comma separated'
        ).default('mamoru,daemon')
    )
    .addOption(
        new Option(
            '-l, --logo <logo>',
            'Logo of the project, should be an url'
        ).default('https://mamoru.ai/default-daemon-logo.png')
    )
    .addOption(
        new Option(
            '--subscribable',
            'If the project is subscribable, or standalone'
        )
    )
    .action((path: string, options: InitOptions) => {
        initCommand.init(program, path, options)
    })

program
    .command('codegen')
    .argument(
        '<path>',
        'path to folder with queryable project',
        parseDirectoryPath
    )
    .option(
        '--ipfs-gateway <url>',
        'url of ipfs gateway',
        'http://localhost:5001'
    )
    .description('generate entities')
    .action((path: string, options: { ipfsGateway: string }) => {
        codegenCommand.codegen(program, path, options.ipfsGateway)
    })

program
    .command('build')
    .argument(
        '[path]',
        'path to folder with queryable project',
        parseOrSetCurrentDirectoryPath,
        '.'
    )
    .description('compile project')
    .action((path: string) => {
        compileCommand.build(program, path)
    })

program
    .command('publish')
    .argument(
        '[path]',
        'path to folder with queryable project',
        parseOrSetCurrentDirectoryPath,
        '.'
    )
    .option('--rpc <rpcUrl>', 'rpc url of the chain')
    .addOption(
        new Option(
            '-k, --private-key <key>',
            'Private key of the account that will be used to publish the project'
        ).makeOptionMandatory()
    )
    .description('publish project')
    .action((path: string, options: PublishOptions) => {
        publishCommand.publish(program, path, options)
    })

program.configureOutput({
    // Visibly override write routines as example!
    writeOut: (str: string) => process.stdout.write(`[OUT] ${str}`),
    writeErr: (str: string) => process.stdout.write(`[ERR] ${str}`),
    // Highlight errors in color.
    outputError: (str: string, write: (str: string) => void) =>
        write(colors.red(str)),
})

program.parse()
