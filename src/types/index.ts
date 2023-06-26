import { Chain_ChainType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { DaemonMetadataParemeter } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'

export type ManifestParameter = Omit<
    DaemonMetadataParemeter,
    'requiredFor' | 'hiddenFor' | 'type'
> & {
    type: 'STRING' | 'NUMBER' | 'BOOLEAN'
    requiredFor?: string[]
    hiddenFor?: string[]
}

export type DaemonMetadataParameter = DaemonMetadataParemeter

export class Manifest {
    version: string
    name: string
    type: 'sql' | 'wasm'
    logoUrl: string
    chains: string[]
    tags: string[]
    parameters?: ManifestParameter[]
    subscribable: boolean
    description: string
}

export type DaemonParameterMap = Record<
    string,
    string | number | null | boolean
>
