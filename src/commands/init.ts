import * as fs from 'fs'
import path from 'path'
import { Command } from 'commander'
import Handlebars from 'handlebars'
import { Logger } from '../services/console'
import dashify from 'dashify'
import { DEFAULT_MAMORU_VERSION, FILES, TEMPLATES } from '../services/constants'
import colors from 'colors'
import { sdkVersions } from '../sdk-dependency-versions'
import { deburr } from 'lodash'
import { checkbox } from '@inquirer/prompts'
import { getAvailableChains } from '../services/utils'

async function init(
    program: Command,
    projectPath: string,
    options: InitOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Run init')
    logger.verbose('options', options)
    const augOps = await getAugmentedInitOptions(options, projectPath)
    const files = getFilesToCreate(projectPath, augOps)

    checkFolderEmptiness(program, Object.values(files))
    logger.ok('Creating Mamoru project files')
    createFile(logger, augOps, TEMPLATES.PACKAGE_JSON, files.PACKAGE_JSON)
    createFile(logger, augOps, TEMPLATES.MANIFEST, files.MANIFEST)
    createFile(logger, augOps, TEMPLATES.README, files.README)
    createFile(logger, augOps, TEMPLATES.GITIGNORE, files.GITIGNORE)

    if (options.type === 'sql') {
        createFile(logger, augOps, TEMPLATES.QUERIES, files.QUERIES)
    }
    if (options.type === 'wasm') {
        createFolder(logger, projectPath, 'src')
        createFolder(logger, projectPath, 'test')
        createFile(logger, augOps, TEMPLATES.WASM_INDEX, files.WASM_INDEX)
        createFile(logger, augOps, TEMPLATES.WASM_TEST, files.WASM_TEST)
    }

    logger.ok('Mamoru project files created!')
    if (options.type === 'wasm') {
        logger.log(`
    ℹ️ To start working on your project, run:
        
        ${colors.grey(`cd ${projectPath}`)}
        ${colors.grey(`npm install`)}
    
    ℹ️ To start the project locally, run:
        
        ${colors.grey(`npm run start`)}
    
    ℹ️ To know more about how to create your own daemons, visit:
        
        ${colors.underline.blue(
            'https://mamoru-foundation.github.io/guides/using-the-mamoru-cli.html'
        )}
    `)
    }
    if (options.type === 'sql') {
        logger.log(`
    ℹ️ To start working on your project, run:
        
        ${colors.grey(`cd ${projectPath}`)}
    
    ℹ️ To know more about how to create your own daemons, visit:
        
        ${colors.underline.blue(
            'https://mamoru-foundation.github.io/guides/using-the-mamoru-cli.html'
        )}
    `)
    }
}

function checkFolderEmptiness(program: Command, paths: string[]): void {
    paths.forEach((p) => {
        if (fs.existsSync(p)) {
            const fileName = path.basename(p)
            throw Error(
                `Directory already contains  a file named "${p}", stopping...`
            )
        }
    })
}

async function getAugmentedInitOptions(
    options: InitOptions,
    projectPath: string
): Promise<AugmentedInitOptions> {
    let name
    if (!options.name && !dashify(projectPath)) {
        name = 'Default name'
    } else {
        name = options.name || deburr(path.basename(projectPath))
    }
    const chain = await queryChains(options)
    return {
        ...options,
        name,
        jsonTags: JSON.stringify(options.tags.split(',')),
        kebabName: dashify(name),
        defaultQuery: getDefaultQuery(chain[0]),
        mamoruSdkAsVersion: sdkVersions.sdk,
        mamoruCustomSdkPackageName: getCustomSdkPackage(chain[0]),
        mamoruCustomSdkPackageVersion: getCustomSdkPackageVersion(chain[0]),
        customSdkCtxName: getCustomSdkCtxName(chain[0]),
        mamoruCoreVersion:
            options.type == 'sql' ? DEFAULT_MAMORU_VERSION : null,
        chain,
    }
}

async function queryChains(options: InitOptions): Promise<string[]> {
    if (options.chain) return options.chain

    const chain = await checkbox({
        choices: getAvailableChains().map((c) => ({
            value: c,
        })),
        message: 'Select the chain you want to use',
    })

    if (!chain.length) throw new Error('Please select at least 1 chain')

    return chain as unknown as string[]
}

function getDefaultQuery(type: string): string {
    switch (type) {
        case 'SUI_MAINNET':
        case 'SUI_TESTNET':
            return `SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')`
        case 'BSC_TESTNET':
        case 'BSC_MAINNET':
            return `SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')`

        case 'ETH_TESTNET':
        case 'ETH_MAINNET':
            return `SELECT 1 FROM transactions t WHERE starts_with(t.tx_hash, '0x1_this_is_an_example_query')`

        case 'APTOS_TESTNET':
        case 'APTOS_MAINNET':
            // return `SELECT * FROM transactions`
            return `SELECT 1 FROM transactions t WHERE starts_with(t.hash, '0x1_this_is_an_example_query')`

        default:
            return `SELECT 1 FROM transactions`
    }
}

function getCustomSdkPackage(type: string): string {
    switch (type) {
        case 'SUI_MAINNET':
        case 'SUI_TESTNET':
            return `@mamoru-ai/mamoru-sui-sdk-as`
        case 'BSC_TESTNET':
        case 'BSC_MAINNET':
            return `@mamoru-ai/mamoru-evm-sdk-as`

        case 'ETH_TESTNET':
        case 'ETH_MAINNET':
            return `@mamoru-ai/mamoru-evm-sdk-as`

        case 'APTOS_TESTNET':
        case 'APTOS_MAINNET':
            return `@mamoru-ai/mamoru-aptos-sdk-as`

        default:
            return `@mamoru-ai/mamoru-evm-sdk-as`
    }
}

function getCustomSdkPackageVersion(type: string): string {
    switch (type) {
        case 'SUI_MAINNET':
        case 'SUI_TESTNET':
            return sdkVersions.sui
        case 'BSC_TESTNET':
        case 'BSC_MAINNET':
        case 'ETH_TESTNET':
        case 'ETH_MAINNET':
            return sdkVersions.evm

        case 'APTOS_TESTNET':
        case 'APTOS_MAINNET':
            return sdkVersions.aptos

        default:
            return sdkVersions.evm
    }
}

function getCustomSdkCtxName(type: string): string {
    switch (type) {
        case 'SUI_MAINNET':
        case 'SUI_TESTNET':
            return `SuiCtx`
        case 'BSC_TESTNET':
        case 'BSC_MAINNET':
        case 'ETH_TESTNET':
        case 'ETH_MAINNET':
            return `EvmCtx`
        case 'APTOS_TESTNET':
        case 'APTOS_MAINNET':
            return `AptosCtx`
        default:
            return `EvmCtx`
    }
}

function getFilesToCreate(
    projectPath: string,
    ops: InitOptions
): Partial<typeof FILES> {
    const files: typeof FILES = { ...FILES }
    if (ops.type === 'sql') {
        delete files.WASM_INDEX
        delete files.WASM_TEST
    }
    if (ops.type === 'wasm') {
        delete files.QUERIES
    }

    const fileDirs: Partial<typeof FILES> = {}

    Object.entries(files).forEach(([key, name]) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fileDirs[key] = path.join(projectPath, name)
    })
    return fileDirs
}

function createFile(
    logger: Logger,
    ops: AugmentedInitOptions,
    templatePath: string,
    targetPath: string
) {
    const targetFileName = path.basename(targetPath)
    logger.verbose(`Creating "${targetFileName}"`)
    const absoluteTemplatePath = path.join(__dirname, templatePath)

    logger.verbose('CREATING FILE', absoluteTemplatePath)
    const templateSrc = fs.readFileSync(absoluteTemplatePath).toString('utf-8')
    const template = Handlebars.compile(templateSrc)
    const result = template(ops)
    fs.writeFileSync(targetPath, result)
}

function createFolder(logger: Logger, projectPath: string, folderPath: string) {
    const folderName = path.basename(folderPath)
    logger.verbose(`Creating "${folderName}" folder`)
    if (!fs.existsSync(path.join(projectPath, folderPath))) {
        fs.mkdirSync(path.join(projectPath, folderName))
    }
}

export interface InitOptions {
    name: string
    description: string
    subscribable: boolean
    logo: string
    tags: string
    chain: string[]
    type: 'sql' | 'wasm'
}

export interface AugmentedInitOptions extends InitOptions {
    jsonTags: string
    kebabName: string
    defaultQuery: string
    mamoruSdkAsVersion: string
    mamoruCustomSdkPackageVersion: string
    mamoruCustomSdkPackageName: string
    customSdkCtxName: string
    mamoruCoreVersion: string | null
}

export default {
    init,
    getAugmentedInitOptions,
}
