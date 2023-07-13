import { Command } from 'commander'
import path from 'node:path'
import fs from 'node:fs'
import { Logger } from './console'
import yaml from 'yaml'
import joi from 'joi'
import { ONLY_ALPHA_NUMERIC } from './constants'
import { Manifest } from '../types'
import { formatJoiError, getAvailableChains } from './utils'

export const validateAndReadManifest = (
    logger: Logger,
    program: Command,
    projectPath: string
): Manifest => {
    logger.ok('Validating Mamoru manifest')
    const manifestPath = getManifest(logger, program, projectPath)
    const manifestSrc = fs.readFileSync(manifestPath, 'utf-8')
    logger.verbose(`Content of "${manifestPath}" is`, manifestSrc)
    const manifest = yaml.parse(manifestSrc)

    validateManifestContentCLI(logger, program, manifest)

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

const manifestParameterSchema = joi.object().keys({
    type: joi.any().valid('STRING', 'NUMBER', 'BOOLEAN').required(),
    key: joi.string().required().pattern(ONLY_ALPHA_NUMERIC),
    title: joi.string().required(),
    description: joi.string().optional(),
    defaultValue: joi.string().optional(),
    requiredFor: joi
        .array()
        .items(joi.string().valid(...getAvailableChains()))
        .optional(),
    hiddenFor: joi
        .array()
        .items(joi.string().valid(...getAvailableChains()))
        .optional(),
})

/**
 * export for testing
 */
export const manifestSchema = joi.object().keys({
    version: joi.any().valid('0.0.1').required(),
    type: joi.any().valid('wasm', 'sql').required(),
    description: joi.string().optional(),
    subscribable: joi.boolean().optional(),
    name: joi.string().required(),
    chains: joi
        .array()
        .items(joi.string().valid(...getAvailableChains()))
        .min(1),
    tags: joi.array().items(joi.string()).optional(),
    logoUrl: joi
        .string()
        .uri({ scheme: ['http', 'https'] })
        .optional(),
    parameters: joi.array().items(manifestParameterSchema).optional(),
    sdkVersions: joi.when('type', {
        is: 'sql',
        then: joi.object().pattern(joi.string(), joi.string()),
        otherwise: joi.forbidden(),
    }),
})

function validateManifestContentCLI(
    logger: Logger,
    program: Command,
    manifest: Record<string, any>
) {
    logger.verbose(`Validating manifest`)

    const { error } = manifestSchema.validate(manifest)

    if (error) {
        const formatted = formatJoiError(error)
        program.error(formatted)
    }
}
