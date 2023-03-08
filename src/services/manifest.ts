import { Command } from 'commander'
import path from 'node:path'
import fs from 'node:fs'
import { Logger } from './console'
import yaml from 'yaml'
import joi from 'joi'
import { ONLY_ALPHA_NUMERIC } from './constants'
import { Manifest } from '../types'
import { formatJoiError } from './utils'

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

const manifestParameterSchema = joi.object().keys({
    type: joi.any().valid('STRING', 'NUMBER', 'BOOLEAN').required(),
    /**
     * @testcases
     *  - key: 'abc'
     * - key: 'abc123'
     * - key: 'abc-123'
     * - key: 'abc_123'
     * - key: 'abc 123'
     * - key: 'abc.123'
     * - key: 'abc,123'
     * - key: 'abc:123'
     * - key: 'abc    123   '
     */
    key: joi.string().required().pattern(ONLY_ALPHA_NUMERIC),
    /**
     * @testcases
     * - description: 'abc'
     * - description: '  sadasasd   ' // trim
     * - description: 'multiline description' // remove line breaks
     * - description: 'hello        hello' // remove extra spaces
     */
    description: joi.string().required(),
    defaultValue: joi.string().required(),
    requiredFor: joi.array().items(joi.string()).optional(),
    hiddenFor: joi.array().items(joi.string()).optional(),
})

const manifestSchema = joi.object().keys({
    version: joi.any().valid('0.0.1').required(),
    type: joi.any().valid('wasm').required(),
    description: joi.string().optional(),
    subscribable: joi.boolean().optional(),
    name: joi.string().required(),
    chain: joi.string(),
    tags: joi.array().items(joi.string()).optional(),
    logoUrl: joi
        .string()
        .uri({ scheme: ['http', 'https'] })
        .optional(),
    parameters: joi.array().items(manifestParameterSchema).optional(),
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
