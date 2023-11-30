import { daemonMetadataParemeter_DaemonParemeterTypeFromJSON } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import {
    DaemonMetadataParameter,
    DaemonParameterMap,
    Manifest,
} from '../../types'
import { DaemonParameter } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon'

export const getMetadataParametersFromManifest = (
    manifest: Manifest
): DaemonMetadataParameter[] => {
    if (!manifest.parameters) return []

    const parameters = manifest.parameters.map((parameter) => ({
        ...parameter,
        type: daemonMetadataParemeter_DaemonParemeterTypeFromJSON(
            parameter.type
        ),
        hiddenFor: (parameter.hiddenFor || []).map((chain) => ({
            name: chain,
        })),
        requiredFor: (parameter.requiredFor || []).map((chain) => ({
            name: chain,
        })),
    }))

    return parameters
}

export const getDaemonParametersFromDaemonParameterMap = (
    obj: DaemonParameterMap
): DaemonParameter[] => {
    return Object.entries(obj).map(([key, value]) => ({
        key,
        value: value.toString(),
    }))
}
