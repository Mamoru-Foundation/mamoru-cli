import * as fs from 'fs'
import path from 'path'
import { Command } from 'commander'
import Handlebars from 'handlebars'
import { Logger } from '../services/console'
import dashify from 'dashify'
import colors from 'colors'
import { deburr } from 'lodash'

import { PLAYBOOK_FILES, PLAYBOOK_TEMPLATES } from '../services/constants'

async function createPlaybook(
    program: Command,
    projectPath: string,
    options: PlaybookOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Run init')
    logger.verbose('options', options)

    const augOps = await getAugmentedInitOptions(options, projectPath)
    const files = getFilesToCreate(projectPath)

    checkFolderEmptiness(program, Object.values(files))

    logger.ok('Creating Mamoru project files')
    createFile(
        logger,
        augOps,
        PLAYBOOK_TEMPLATES.PLAYBOOK_YAML,
        files.PLAYBOOK_YAML
    )
    createFile(logger, augOps, PLAYBOOK_TEMPLATES.README, files.README)
    createFile(logger, augOps, PLAYBOOK_TEMPLATES.GITIGNORE, files.GITIGNORE)

    logger.ok('Mamoru project files created!')

    logger.log(`
    ℹ️ To start working on your project, run:
        
        ${colors.grey(`cd ${projectPath}`)}
    
    ℹ️ To know more about how to create your own playbook, visit:
        
        ${colors.underline.blue(
            'https://mamoru-foundation.github.io/guides/using-the-mamoru-cli.html'
        )}
    `)
}

function checkFolderEmptiness(program: Command, paths: string[]): void {
    paths.forEach((p) => {
        if (fs.existsSync(p)) {
            throw new Error(
                `Directory already contains a file named "${p}", stopping...`
            )
        }
    })
}

async function getAugmentedInitOptions(
    options: PlaybookOptions,
    projectPath: string
): Promise<AugmentedPlaybookOptions> {
    let name
    if (!options.name && !dashify(projectPath)) {
        name = 'Default Playbook name'
    } else {
        name = options.name || deburr(path.basename(projectPath))
    }

    return {
        ...options,
        name,
        kebabName: dashify(name),
    }
}

function getFilesToCreate(projectPath: string): Partial<typeof PLAYBOOK_FILES> {
    const fileDirs: Partial<typeof PLAYBOOK_FILES> = {}

    Object.entries(PLAYBOOK_FILES).forEach(([key, name]) => {
        fileDirs[key as keyof typeof PLAYBOOK_FILES] = path.join(
            projectPath,
            name
        )
    })
    return fileDirs
}

function createFile(
    logger: Logger,
    ops: AugmentedPlaybookOptions,
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

export interface PlaybookOptions {
    name: string
}

export interface AugmentedPlaybookOptions extends PlaybookOptions {
    kebabName: string
}

export default {
    createPlaybook,
}
