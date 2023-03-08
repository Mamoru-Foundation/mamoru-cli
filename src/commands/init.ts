import * as fs from 'fs'
import path from 'path'
import { Command } from 'commander'
import Handlebars from 'handlebars'
import { Logger } from '../services/console'
import dashify from 'dashify'
import { FILES, TEMPLATES } from '../services/constants'

function init(program: Command, projectPath: string, options: InitOptions) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Run init')
    const augOps = getAugmentedInitOptions(options)

    const files = getFilesToCreate(projectPath, augOps)

    checkFolderEmptyness(program, Object.values(files))
    logger.ok('Creating Queryable project files')

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

    logger.ok('Queryable project files created!')
    logger.log(`
    ℹ️ To start working on your project, run:
        cd ${projectPath}
        npm install
    ℹ️ To start the project locally, run:
        npm run start
    ℹ️ To know more about how to create your own daemons, visit:
        https://mamoru.ai/docs/daemon-development
    `)
}

function checkFolderEmptyness(program: Command, paths: string[]): void {
    paths.forEach((p) => {
        if (fs.existsSync(p)) {
            const fileName = path.basename(p)
            program.error(
                `Directory  already contains  a file named "${fileName}", stopping...`
            )
        }
    })
}

function getAugmentedInitOptions(options: InitOptions): AugmentedInitOptions {
    return {
        ...options,
        jsonTags: JSON.stringify(options.tags.split(',')),
        kebabName: dashify(options.name),
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

    const templateSrc = fs.readFileSync(templatePath).toString('utf-8')
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
    chain: string
    type: 'sql' | 'wasm'
}

interface AugmentedInitOptions extends InitOptions {
    jsonTags: string
    kebabName: string
}

export default {
    init,
}
