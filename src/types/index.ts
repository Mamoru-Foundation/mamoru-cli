import { DaemonMetadataParemeter } from 'validation-chain-client-ts/validationchain.validationchain'
import { Chain_ChainType } from 'validation-chain-client-ts/validationchain.validationchain/types/validationchain/validationchain/chain'

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

export enum IncidentSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    ALERT = 'ALERT',
}
