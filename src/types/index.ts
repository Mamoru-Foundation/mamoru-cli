import { DaemonMetadataParemeter } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'

export type ManifestParameter = Omit<
    DaemonMetadataParemeter,
    'requiredFor' | 'hiddenFor' | 'type' | 'defaultValue' | 'min' | 'max'
> & {
    type:
        | 'STRING'
        | 'NUMBER'
        | 'BOOLEAN'
        | 'INT8'
        | 'INT256'
        | 'UINT8'
        | 'UINT256'
        | 'FLOAT'
    requiredFor?: string[]
    hiddenFor?: string[]
    defaultValue: string | number | boolean
    min: string | number
    max: string | number
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

export type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>
      }
    : T
