import * as fs from 'fs'
import path from 'path'
import { Command } from 'commander'
import Handlebars from 'handlebars'
import { Logger } from '../../services/console'
import dashify from 'dashify'
import colors from 'colors'
import { deburr } from 'lodash'

import { PLAYBOOK_FILES, PLAYBOOK_TEMPLATES } from '../../services/constants'
import { checkFolderEmptiness } from '../../services/utils'

async function initPlaybook(
    program: Command,
    projectPath: string,
    options: InitPlaybookOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    logger.verbose('Run playbook init')
    logger.verbose('options', options)
    logger.verbose('projectPath', projectPath)

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
    ℹ️ To publish your playbook to the Validation Chain, run:
        ${colors.grey(`cd ${projectPath}`)}
        ${colors.grey(`mamoru-cli playbook publish`)}
    
    ℹ️ To know more about how to create your own playbook, visit:
        
        ${colors.underline.blue('mamoru-foundation.github.io')}
    `)
}

//
async function getAugmentedInitOptions(
    options: InitPlaybookOptions,
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
    const absoluteTemplatePath = path.join(__dirname, '..', templatePath)

    logger.verbose('CREATING FILE', absoluteTemplatePath)
    const templateSrc = fs.readFileSync(absoluteTemplatePath).toString('utf-8')
    const template = Handlebars.compile(templateSrc)
    const result = template(ops)
    fs.writeFileSync(targetPath, result)
}

export interface InitPlaybookOptions {
    name: string
    skipTelemetry: true
}

export interface AugmentedPlaybookOptions extends InitPlaybookOptions {
    kebabName: string
}

export default {
    initPlaybook,
    getAugmentedInitOptions,
    getFilesToCreate,
    createFile,
}
