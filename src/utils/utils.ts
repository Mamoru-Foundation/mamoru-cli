import { exec } from 'node:child_process'
import { DaemonParameterMap } from '../types'

export const runCommand = (cmd: string) => {
    return new Promise((resolve, reject) => {
        const child = exec(cmd, (err) => {
            // eslint-disable-next-line no-console
            if (err) {
                reject(err)
            }
            resolve(undefined)
        })
        child.stderr.pipe(process.stderr)
        child.stdout.pipe(process.stdout)
    })
}

export function validateAndParseParameterFlag(
    parameters: string
): DaemonParameterMap {
    if (!parameters) return {}
    let parsed
    try {
        parsed = JSON.parse(parameters)
    } catch (error) {
        throw new Error('Parameters must be a valid JSON string')
    }
    if (typeof parsed !== 'object') {
        throw new Error('Parameters must be an object')
    }

    if (Array.isArray(parsed)) {
        throw new Error('Parameters must be an object')
    }

    return parsed
}
