import * as fs from 'fs'
import * as path from 'path'
import yaml from 'yaml'
import { DaemonContentQuery } from '../types'

class QueryManifestService {
    private getFile(projectPath: string) {
        const p = path.join(projectPath, 'queries.yml')
        if (fs.existsSync(p)) {
            throw new Error('queries.yml file not found')
        }

        return fs.readFileSync(p, 'utf-8')
    }
    private parseFile(file: string) {
        return yaml.parse(file)
    }

    public getQueries(projectPath: string): DaemonContentQuery[] {
        const file = this.getFile(projectPath)
        const parsed = this.parseFile(file)
        return parsed.queries
    }
}
