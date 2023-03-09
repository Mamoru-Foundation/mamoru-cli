import {
    DaemonMetadataContentQuery,
    DaemonMetadataParemeter,
} from 'validation-chain-client-ts/validationchain.validationchain'
import { Chain_ChainType } from 'validation-chain-client-ts/validationchain.validationchain/types/validationchain/validationchain/chain'

export class DaemonParameters {
    type: 'STRING' | 'NUMBER' | 'BOOLEAN'
    key: string
    description: string
    defaultValue: string
    requiredFor: Chain[]
    hiddenFor: Chain[]
}
export class Manifest {
    version: string
    name: string
    type: 'sql' | 'wasm'
    logoUrl: string
    chain: Chain_ChainType
    tags: string[]
    parameters?: DaemonMetadataParemeter[]
    subscribable: boolean
    description: string
}

export type Chain = {
    chainId: string
}

export enum IncidentSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    ALERT = 'ALERT',
}

export type DaemonContentSql = {
    type: 'SQL'
    queries: DaemonMetadataContentQuery[]
}

export type DaemonContentWasm = {
    type: 'WASM'
    wasmModule: string
}

export type DaemonContent = DaemonContentSql | DaemonContentWasm

export type CreateDaemonMetadataDTO = {
    logoUrl: string
    metadataType: 'SOLE' | 'SUBSCRIBABLE'
    title: string
    description: string
    tags: string[]
    supportedChains: Chain[]
    parameters: DaemonParameters[]
    content: DaemonContent
}
