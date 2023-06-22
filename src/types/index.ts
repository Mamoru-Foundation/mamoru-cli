import { DaemonMetadataParemeter } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'

export class Manifest {
    version: string
    name: string
    type: 'sql' | 'wasm'
    logoUrl: string
    chain: string
    tags: string[]
    parameters?: DaemonMetadataParemeter[]
    subscribable: boolean
    description: string
}
