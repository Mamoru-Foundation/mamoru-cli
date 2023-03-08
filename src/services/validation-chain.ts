import { JsonRpcClient, JsonRpcRequest } from '@cosmjs/json-rpc'
import {
    CreateDaemonMetadataDTO,
    DaemonContent,
    DaemonContentQuery,
    Manifest,
} from '../types'

class ValidationChainService {
    client: JsonRpcClient
    constructor(url: string, privateKey: string) {
        this.client = new JsonRpcClient(url)
    }

    async registerDaemonMetadata(
        manifest: Manifest,
        queries: DaemonContentQuery[],
        wasmModule?: string
    ) {
        const payload: CreateDaemonMetadataDTO = {
            logoUrl: manifest.logoUrl,
            metadataType: getSubcribableType(manifest),
            title: manifest.name,
            description: manifest.description,
            tags: manifest.tags,
            supportedChains: [{ chainId: manifest.chain }],
            parameters: manifest.parameters,
            content: getDaemonContent(manifest, queries, wasmModule),
        }
        const request = await createJsonRpcRequest(
            'registerDaemonMetadata',
            payload
        )

        return request
    }
}

export default ValidationChainService

function getSubcribableType(manifest: Manifest) {
    if (manifest.subscribable) {
        return 'SUBSCRIBABLE'
    }
    return 'SOLE'
}

function getDaemonContent(
    manifest: Manifest,
    queries: DaemonContentQuery[],
    wasmModule?: string
): DaemonContent {
    if (manifest.type === 'wasm') {
        return {
            type: 'WASM',
            wasmModule,
        }
    }
    return {
        type: 'SQL',
        queries,
    }
}

function randomNumericChar(): string {
    const numbersWithoutZero = '123456789'
    return numbersWithoutZero[
        Math.floor(Math.random() * numbersWithoutZero.length)
    ]
}

function randomId(): number {
    return parseInt(
        Array.from({ length: 12 })
            .map(() => randomNumericChar())
            .join(''),
        10
    )
}

function createJsonRpcRequest(
    method: string,
    params?: Record<string, any>
): JsonRpcRequest {
    const paramsCopy = params ? { ...params } : {}
    return {
        jsonrpc: '2.0',
        id: randomId(),
        method: method,
        params: paramsCopy,
    }
}
