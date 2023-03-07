import { Command } from 'commander'
import path from 'node:path'
import fs from 'node:fs'
import { Logger } from './console'
import yaml from 'yaml'
import joi from 'joi'

export type Manifest = {
    version: string
    type: 'sql' | 'wasm'
    description?: string
    logoUrl?: string
    name: string
}

export const validateAndReadManifest = (
    logger: Logger,
    program: Command,
    projectPath: string
): Manifest => {
    logger.ok('Validating Queryable manifest')
    const manifestPath = getManifest(logger, program, projectPath)
    const manifestSrc = fs.readFileSync(manifestPath, 'utf-8')
    logger.verbose(`Content of "${manifestPath}" is`, manifestSrc)
    const manifest = yaml.parse(manifestSrc)

    validateManifestContent(logger, program, manifest)

    return manifest
}

export const serializeAndSaveManifest = (
    logger: Logger,
    manifest: Manifest,
    buildPath: string
) => {
    const compiledManifestPath = path.join(buildPath, 'manifest.yml')
    const compiledManifest = yaml.stringify(manifest)
    logger.verbose(`Saving compiled manifest to "${compiledManifestPath}"`)
    fs.writeFileSync(compiledManifestPath, compiledManifest)
}

function getManifest(logger: Logger, program: Command, projectPath: string) {
    const ymlPath = path.join(projectPath, 'manifest.yml')
    const yamlPath = path.join(projectPath, 'manifest.yaml')

    logger.verbose(`Checking if "${ymlPath}" exists`)

    if (fs.existsSync(ymlPath)) {
        logger.verbose(`"${ymlPath}" exists`)
        return ymlPath
    }
    logger.verbose(`Checking if "${yamlPath}" exists`)

    if (fs.existsSync(yamlPath)) {
        logger.verbose(`"${yamlPath}" exists`)
        return yamlPath
    }

    program.error(' manifest not found.')
}

const manifestSchema = joi.object().keys({
    version: joi.any().valid('0.0.1').required(),
    type: joi.any().valid('wasm').required(),
    description: joi.string().optional(),
    name: joi.string().required(),
    chain: joi.string(),
    tags: joi.array().items(joi.string()).optional(),
    logoUrl: joi
        .string()
        .uri({ scheme: ['http', 'https'] })
        .optional(),
})

function validateManifestContent(
    logger: Logger,
    program: Command,
    manifest: Record<string, any>
) {
    logger.verbose(`Validating manifest`)
    if (manifest.type == 'sql')
        program.error('Oops, nothing to build for SQL based daemons.')

    const { error } = manifestSchema.validate(manifest)

    if (error) {
        const formatted = formatJoiError(error)
        program.error(formatted)
    }
}

function formatJoiError(error: joi.ValidationError): string {
    const formattedExplanation = error.details
        .map((error, index) => {
            return `${index + 1}. ${error.context.message || error.message}`
        })
        .join('\n')

    return `manifest contains invalid structure.\nErrors:\n${formattedExplanation}`
}