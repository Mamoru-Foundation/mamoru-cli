import joi from 'joi'
import * as fs from 'fs'
import * as path from 'path'
import yaml from 'yaml'
import { formatJoiError, joiSeverityValidator } from './utils'
import { FILES } from './constants'
import { Logger } from './console'
import { IncidentSeverity } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/incident'
import { DaemonMetadataContentQueryManifest } from '../types'

class QueryManifestService {
    private getFile(logger: Logger, projectPath: string) {
        const p = path.join(projectPath, FILES.QUERIES)
        logger.verbose(`Checking if "${p}" exists`)
        if (!fs.existsSync(p)) {
            throw new Error('queries.yml file not found')
        }

        return fs.readFileSync(p, 'utf-8')
    }

    private parseFile(file: string): object {
        return yaml.parse(file)
    }

    public get(
        logger: Logger,
        projectPath: string
    ): DaemonMetadataContentQueryManifest {
        const file = this.getFile(logger, projectPath)
        const parsed = this.parseFile(file)
        this.validateFile(parsed)

        return parsed as DaemonMetadataContentQueryManifest
    }

    private validateFile(file: object): void {
        const { error } = this.fileSchema.validate(file)
        if (error) {
            const formatted = formatJoiError(error)
            throw new Error(formatted)
        }
    }

    private fileSchema = joi.object({
        version: joi.string().optional(),
        queries: joi.array().items(
            joi.object({
                query: joi.string().required(),
                severity: joiSeverityValidator,
                incidentMessage: joi.string().required(),
            })
        ),
    })
}

export default new QueryManifestService()
