import joi from 'joi'
import * as fs from 'fs'
import * as path from 'path'
import yaml from 'yaml'
import { DaemonContentQuery, IncidentSeverity } from '../types'
import { formatJoiError } from './utils'
import { FILES } from './constants'

class QueryManifestService {
    private getFile(projectPath: string) {
        const p = path.join(projectPath, FILES.QUERIES)
        if (fs.existsSync(p)) {
            throw new Error('queries.yml file not found')
        }

        return fs.readFileSync(p, 'utf-8')
    }
    private parseFile(file: string): { queries: DaemonContentQuery[] } {
        return yaml.parse(file)
    }

    public getQueries(projectPath: string): DaemonContentQuery[] {
        const file = this.getFile(projectPath)
        const parsed = this.parseFile(file)
        this.validateFile(parsed)
        return parsed.queries
    }

    private validateFile(file: { queries: DaemonContentQuery[] }): void {
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
