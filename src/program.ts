#! /usr/bin/env node
import colors from 'colors'
import * as fs from 'fs'
import { program, InvalidArgumentError, Option } from 'commander'
import initCommand, { InitOptions } from './commands/init'
import compileCommand from './commands/build'
import publishCommand, { PublishOptions } from './commands/publish'
import launch from './commands/launch'
import { getAvailableChains } from './services/utils'
import initPlaybook, { PlaybookOptions } from './commands/playbook-init'

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
        'path to folder with Mamoru project',
        parseOrCreateDirectoryPath,
        ''
    )
    .addOption(
        new Option('-t, --type <type>', 'Type of project')
            .choices(['sql', 'wasm'])
            .default('wasm')
    )
    .addOption(
        new Option(
            '-c, --chain <chain...>',
            'Chain where the daemon runs'
        ).choices(getAvailableChains() as unknown as string[])
    )
    .addOption(new Option('-n, --name <name>', 'Name of the project'))
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
        ).default(false)
    )
    .description('initialize demon project in a folder')
    .action((path: string, options: InitOptions) => {
        initCommand.init(program, path, options)
    })

program
    .command('build')
    .argument(
        '[path]',
        'path to folder with Mamoru project',
        parseOrSetCurrentDirectoryPath,
        '.'
    )
    .description('compile daemon project')
    .action((path: string) => {
        compileCommand.build(program, path)
    })

program
    .command('publish')
    .argument(
        '[path]',
        'path to folder with Mamoru project',
        parseOrSetCurrentDirectoryPath,
        '.'
    )
    .option('--rpc <rpcUrl>', 'rpc url of the chain')
    .addOption(
        new Option(
            '--gas <gas>',
            'gas fee of the transaction  (if daemon is sole, it will be used as limit for both metadata and daemon creation)'
        ).default('200000')
    )
    .addOption(
        new Option(
            '-k, --private-key <key>',
            'Private key of the account that will be used to publish the project'
        )
            .makeOptionMandatory()
            .env('MAMORU_PRIVATE_KEY')
    )
    .addOption(
        new Option('-c, --chain <chain>', 'Chain to deploy').choices(
            getAvailableChains() as unknown as string[]
        )
    )
    .addOption(
        new Option(
            '--parameters <parameters>',
            'JSON stringified parameter map ie: {"key": "value"}'
        )
    )
    .description('publish daemon project')
    .action((path: string, options: PublishOptions) => {
        publishCommand.publish(program, path, options)
    })

program
    .command('launch')
    .description('launch daemon from subscribable metadata')
    .addOption(
        new Option(
            '-m, --metadataId <metadataId>',
            'Daemon MetadataId'
        ).makeOptionMandatory()
    )
    .option('--rpc <rpcUrl>', 'rpc url of the chain')
    .addOption(
        new Option('--gas <gas>', 'gas fee of the transaction').default(
            '200000'
        )
    )
    .addOption(
        new Option(
            '-k, --private-key <key>',
            'Private key of the account that will be used to publish the project'
        )
            .makeOptionMandatory()
            .env('MAMORU_PRIVATE_KEY')
    )
    .addOption(
        new Option('-c, --chain <chain>', 'Chain to deploy').choices(
            getAvailableChains() as unknown as string[]
        )
    )
    .addOption(
        new Option(
            '--parameters <parameters>',
            'JSON stringified parameter map ie: {"key": "value"}'
        )
    )
    .action((options: any) => {
        launch(program, options)
    })

program
    .command('playbook init <path>')
    .description('initialize playbook in a folder')
    .addOption(new Option('-n, --name <name>', 'Name of the playbook'))
    .action((path: string, options: PlaybookOptions) => {
        initPlaybook.initPlaybook(program, path, options)
    })

program
    .command('playbook publish <path>')
    .description('publish playbook')
    .option('--rpc <rpcUrl>', 'rpc url of the chain')
    .addOption(
        new Option('--gas <gas>', 'gas fee of the transaction').default(
            '200000'
        )
    )
    .addOption(
        new Option('-k, --private-key <key>', 'Private key')
            .makeOptionMandatory()
            .env('MAMORU_PRIVATE_KEY')
    )
    .action((path: string, options: PublishOptions) => {
        // Call the appropriate function to publish playbook
        // You may need to create this function in your code
        // For example:
        // publishPlaybook(program, path, options);
    })

program.version(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    `Mamoru CLI ${require('../package.json').version}`,
    '--version'
)
program.configureOutput({
    // Visibly override write routines as example!
    writeOut: (str: string) => process.stdout.write(`[OUT] ${str}`),
    writeErr: (str: string) => process.stdout.write(`[ERR] ${str}`),
    // Highlight errors in color.
    outputError: (str: string, write: (str: string) => void) =>
        write(colors.red(str)),
})
export default program
