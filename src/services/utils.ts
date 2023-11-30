import joi from 'joi'
import { Command } from 'commander'
import fs from 'fs'
import { IncidentSeverity } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/incident'
import { getSupportedNetworks } from './graphql-api/graphql-api.service'

export function formatJoiError(error: joi.ValidationError): string {
    const formattedExplanation = error.details
        .map((error, index) => {
            return `${index + 1}. ${error.context.message || error.message}`
        })
        .join('\n')

    return `manifest contains invalid structure.\nErrors:\n${formattedExplanation}`
}

export async function getAvailableChains(): Promise<string[]> {
    const r = await getSupportedNetworks()

    return r.map((x: any) => x.enumValue)
}

export function checkFolderEmptiness(program: Command, paths: string[]): void {
    paths.forEach((p) => {
        if (fs.existsSync(p)) {
            throw new Error(
                `Directory already contains a file named "${p}", stopping...`
            )
        }
    })
}

export const joiSeverityValidator = joi
    .string()
    .valid(
        ...Object.values(IncidentSeverity).filter(
            (v) => typeof v === 'string' && v !== '' && v !== 'UNRECOGNIZED'
        )
    )
    .required()
