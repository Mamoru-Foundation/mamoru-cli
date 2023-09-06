#! /usr/bin/env node
import colors from 'colors'
import * as fs from 'fs'
import { program, InvalidArgumentError, Option } from 'commander'
import initCommand, { InitOptions } from './commands/agents/init'
import compileCommand from './commands/agents/build'
import publishCommand, { PublishOptions } from './commands/agents/publish'
import launch from './commands/agents/launch'
import { getAvailableChains } from './services/utils'
import { askForTelemetry } from './commands/ask-for-telemetry'
import initPlaybook, {
    PlaybookOptions,
} from './commands/playbooks/playbook-init'
import publishPlaybook, {
    PlaybookPublishOptions,
} from './commands/playbooks/playbook-publish'
import removeDaemon from './commands/agents/daemon-remove'
import { initializeAuthCommands } from './commands/auth'

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

program.name('mamoru-cli')

program.option(
    '-v, --verbose',
    'define verbosity to show execution logs',
    increaseVerbosity,
    0
)

initializeAuthCommands(program)

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
            'Chain where the Agent runs'
        ).choices(getAvailableChains() as unknown as string[])
    )
    .addOption(new Option('-n, --name <name>', 'Name of the project'))
    .addOption(
        new Option(
            '-d, --description <description>',
            'Description of the project'
        ).default('Mamoru Agent')
    )
    .addOption(
        new Option(
            '-t, --tags <tags>',
            'Tags of the project, comma separated'
        ).default('mamoru,agent')
    )
    .addOption(
        new Option(
            '-l, --logo <logo>',
            'Logo of the project, should be an url'
        ).default('https://mamoru.ai/default-agent-logo.png')
    )
    .addOption(
        new Option(
            '--subscribable',
            'If the project is subscribable, or standalone'
        ).default(false)
    )
    .addOption(
        new Option(
            '--skipTelemetry',
            'Skip telemetry question, useful for CI/CD'
        )
    )
    .description('initialize a new Agent project in a folder')
    .action(async (path: string, options: InitOptions) => {
        await askForTelemetry(options)
        await initCommand.init(program, path, options)
    })

program
    .command('build')
    .argument(
        '[path]',
        'path to folder with Mamoru project',
        parseOrSetCurrentDirectoryPath,
        '.'
    )
    .description('compile agent project')
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
            'gas fee of the transaction  (if agent is sole, it will be used as limit for both metadata and agent creation)'
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
    .description('publish agent project')
    .action((path: string, options: PublishOptions) => {
        publishCommand.publish(program, path, options)
    })

program
    .command('launch')
    .description('launch agent from subscribable metadata')
    .addOption(
        new Option(
            '-m, --metadataId <metadataId>',
            'Agent MetadataId'
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
    .command('remove')
    .description('remove agent from validation chain')
    .argument('<id>', 'Id of the agent')
    .option('--rpc <rpcUrl>', 'rpc url of the chain')
    .addOption(
        new Option(
            '-k, --private-key <key>',
            'Private key of the account that will be used to publish the project'
        )
            .makeOptionMandatory()
            .env('MAMORU_PRIVATE_KEY')
    )
    .action((id: string, options: any) => {
        removeDaemon(program, id, options)
    })

const playbook = program
    .command('playbook')
    .description('Playbook related commands')
playbook
    .command('init')
    .argument(
        '<path>',
        'path to folder with Mamoru project',
        parseOrCreateDirectoryPath,
        '.'
    )
    .description('initialize playbook in a folder')
    .addOption(new Option('-n, --name <name>', 'Name of the playbook'))
    .action((path: string, options: PlaybookOptions) => {
        initPlaybook.initPlaybook(program, path, options)
    })

playbook
    .command('publish')
    .argument(
        '[path]',
        'path to folder with Mamoru project',
        parseOrSetCurrentDirectoryPath,
        '.'
    )
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
    .addOption(
        new Option(
            '-id, --playbookId <playbookId>',
            'Id of the playbook, it is required if you want to update a playbook'
        )
    )
    .action((path: string, options: PlaybookPublishOptions) => {
        publishPlaybook.playbookPublish(program, path, options)
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
