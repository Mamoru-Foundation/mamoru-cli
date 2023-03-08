import { JsonRpcClient, JsonRpcRequest } from '@cosmjs/json-rpc'
import { CreateDaemonMetadataDTO, Manifest } from '../types'

class ValidationChain {
    client: JsonRpcClient
    constructor() {
        this.client = new JsonRpcClient('http://localhost:26657')
    }

    async registerDaemonMetadata(manifest: Manifest) {
        const payload: CreateDaemonMetadataDTO = {
            logoUrl: manifest.logoUrl,
            metadataType: getSubcribableType(manifest),
            title: manifest.name,
            description: manifest.description,
            tags: manifest.tags,
            supportedChains: [{ chainId: manifest.chain }],
            parameters: manifest.parameters,
        }
        const request = createJsonRpcRequest('registerDaemonMetadata', {})
    }
}

function getSubcribableType(manifest: Manifest) {
    if (manifest.subscribable) {
        return 'SUBSCRIBABLE'
    }
    return 'SOLE'
}

function getDaemonContent(manifest: Manifest) {
    if (manifest.type === 'wasm') {
        return {
            type: 'WASM',
            wasmModule: '',
        }
    }
    return {
        type: 'SQL',
        queries: [],
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
