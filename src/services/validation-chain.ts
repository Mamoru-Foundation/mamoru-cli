import { Manifest } from '../types'
import { Client } from '../../../validation-chain/ts-client'
import { CreateDaemonMetadataCommandRequestDTO } from 'validation-chain-client-ts/validationchain.validationchain'
import type {
    DaemonMetadataContent,
    DaemonMetadataContentType,
    DaemonMetadataType,
} from 'validation-chain-client-ts/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import { DaemonMetadataContentQuery } from '../../../validation-chain/ts-client/validationchain.validationchain'
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing'
import { fromBase64 } from '@cosmjs/encoding'

class ValidationChainService {
    constructor(
        private readonly url: string,
        private readonly privateKey: string
    ) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
    }

    async registerDaemonMetadata(
        manifest: Manifest,
        queries: DaemonMetadataContentQuery[],
        wasmModule?: string
    ) {
        const key = fromBase64(this.privateKey)
        const wallet = await DirectSecp256k1Wallet.fromKey(key)
        const accounts = await wallet.getAccounts()
        const address = accounts[0].address

        const client = new Client(
            {
                apiURL: 'http://0.0.0.0:1317',
                rpcURL: this.url || 'http://0.0.0.0:26657',
            },
            wallet
        )
        const payload: CreateDaemonMetadataCommandRequestDTO = {
            logoUrl: manifest.logoUrl,
            metadataType: getSubcribableType(manifest),
            title: manifest.name,
            description: manifest.description,
            tags: manifest.tags,
            supportedChains: [{ chainType: manifest.chain }],
            parameters: manifest.parameters,
            content: getDaemonContent(manifest, queries, wasmModule),
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await client.ValidationchainValidationchain.tx.sendMsgCreateDaemonMetadata(
            {
                value: {
                    creator: address,
                    daemonMetadata: payload,
                },
            }
        )
    }
}

export default ValidationChainService

function getSubcribableType(manifest: Manifest): DaemonMetadataType {
    if (manifest.subscribable) {
        return 2
    }
    return 1
}

function getDaemonContent(
    manifest: Manifest,
    queries: DaemonMetadataContentQuery[],
    wasmModule?: string
): DaemonMetadataContent {
    if (manifest.type === 'wasm') {
        return {
            type: 1,
            wasmModule,
            query: [],
        }
    }
    return {
        type: 0,
        query: queries,
        wasmModule: '',
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
): any {
    const paramsCopy = params ? { ...params } : {}
    return {
        jsonrpc: '2.0',
        id: randomId(),
        method: method,
        params: paramsCopy,
    }
}
