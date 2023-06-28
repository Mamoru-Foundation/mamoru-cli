import { exec } from 'node:child_process'
import { DaemonParameterMap } from '../types'
import { DaemonMetadata } from '@mamoru-ai/validation-chain-ts-client/src/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata'
import { LaunchOptions } from '../commands/launch'
import { chain_ChainTypeFromJSON } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { input } from '@inquirer/prompts'
import { PublishOptions } from '../commands/publish'

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

export async function queryDaemonParameters(
    metadata: DaemonMetadata,
    options: LaunchOptions | PublishOptions,
    chain: string
): Promise<Record<string, any>> {
    if (options.parameters)
        return validateAndParseParameterFlag(options.parameters)

    const chainType = chain_ChainTypeFromJSON(chain)
    const parameters = metadata.parameters.filter((el) => {
        if (el.hiddenFor.map((el) => el.chainType).includes(chainType))
            return false
        return true
    })

    const result: Record<string, string> = {}
    for (const parameter of parameters) {
        const answer = await input({
            message: `Enter value for parameter "${parameter.key}"`,
            default: parameter.defaultValue,
        })
        result[parameter.key] = answer
    }

    return result
}
