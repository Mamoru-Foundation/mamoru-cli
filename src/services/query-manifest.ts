import joi from 'joi'
import * as fs from 'fs'
import * as path from 'path'
import yaml from 'yaml'
import { IncidentSeverity } from '../types'
import { formatJoiError } from './utils'
import { FILES } from './constants'
import { DaemonMetadataContentQuery } from 'validation-chain-client-ts/validationchain.validationchain'
import { Logger } from './console'

class QueryManifestService {
    private getFile(logger: Logger, projectPath: string) {
        const p = path.join(projectPath, FILES.QUERIES)
        logger.verbose(`Checking if "${p}" exists`)
        if (!fs.existsSync(p)) {
            throw new Error('queries.yml file not found')
        }

        return fs.readFileSync(p, 'utf-8')
    }
    private parseFile(file: string): { queries: DaemonMetadataContentQuery[] } {
        return yaml.parse(file)
    }

    public getQueries(
        logger: Logger,
        projectPath: string
    ): DaemonMetadataContentQuery[] {
        const file = this.getFile(logger, projectPath)
        const parsed = this.parseFile(file)
        this.validateFile(parsed)
        return parsed.queries
    }

    private validateFile(file: {
        queries: DaemonMetadataContentQuery[]
    }): void {
        const { error } = this.fileSchema.validate(file)
        if (error) {
            const formatted = formatJoiError(error)
            throw new Error(formatted)
        }
    }

    private fileSchema = joi.object({
        queries: joi.array().items(
            joi.object({
                query: joi.string().required(),
                severity: joi
                    .string()
                    .valid(...Object.values(IncidentSeverity))
                    .required(),
                incidentMessage: joi.string().required(),
            })
        ),
    })
}

export default new QueryManifestService()
