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

export type DaemonMetadataContentQuery = {
    query: string
    incidentMessage: string
    severity:
        | 'SEVERITY_INFO'
        | 'SEVERITY_WARNING'
        | 'SEVERITY_CRITICAL'
        | 'SEVERITY_ERROR'
}

export type RcConfig = {
    telemetry?: boolean
    authToken?: string
}

export type DaemonMetadataContentQueryManifest = {
    version?: string
    queries: DaemonMetadataContentQuery[]
}

export type Playbook = {
    on: {
        daemonId: string
    }[]
}
