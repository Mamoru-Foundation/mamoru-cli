import { Chain_ChainType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { DaemonMetadataParemeter } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'

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
