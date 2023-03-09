import { Manifest } from '../types'
import { Client } from '../../../validation-chain/ts-client'
import {
    CreateDaemonMetadataCommandRequestDTO,
    DaemonRegisterCommandRequestDTO,
} from 'validation-chain-client-ts/validationchain.validationchain'
import type {
    DaemonMetadataContent,
    DaemonMetadataType,
} from 'validation-chain-client-ts/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import { DaemonMetadataContentQuery } from '../../../validation-chain/ts-client/validationchain.validationchain'
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing'
import { fromBase64 } from '@cosmjs/encoding'
import { Logger } from './console'
import {
    MsgCreateDaemonMetadataResponse,
    MsgRegisterDaemon,
} from 'validation-chain-client-ts/validationchain.validationchain/types/validationchain/validationchain/tx'

export interface MsgData {
    msgType: string
    data: Uint8Array
}

class ValidationChainService {
    /**
     * ts-client types are broken, so using any for now
     */
    client: any
    constructor(
        private readonly url: string,
        private readonly privateKey: string,
        private readonly logger: Logger
    ) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
    }

    private async getClient() {
        // if (this.client) return this.client

        const key = fromBase64(this.privateKey)
        const wallet = await DirectSecp256k1Wallet.fromKey(key)

        this.client = new Client(
            {
                apiURL: 'http://0.0.0.0:1317',
                rpcURL: this.url || 'http://0.0.0.0:26657',
            },
            wallet
        )

        return this.client
    }

    private async getAddress() {
        const client = await this.getClient()
        const accounts = await client.getAccounts()
        return accounts[0].address
    }

    async registerDaemonMetadata(
        manifest: Manifest,
        queries: DaemonMetadataContentQuery[],
        wasmModule?: string
    ): Promise<MsgCreateDaemonMetadataResponse> {
        this.logger.verbose('Registering daemon metadata')
        const client = await this.getClient()
        const address = await this.getAddress()

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

        this.logger.verbose('Payload', payload)

        const r =
            await client.ValidationchainValidationchain.tx.sendMsgCreateDaemonMetadata(
                {
                    value: {
                        creator: address,
                        daemonMetadata: payload,
                    },
                }
            )

        const data = r.data as MsgData[]

        return {
            daemonMetadataId: data[0].data.toString(),
        }
    }

    async registerDaemon(manifest: Manifest, daemonMetadataId: string) {
        this.logger.verbose('Registering daemon')
        const client = await this.getClient()
        const address = await this.getAddress()

        const payload: DaemonRegisterCommandRequestDTO = {
            chain: { chainType: manifest.chain },
            daemonMetadataId,
            // @TODO: add parameters
            parameters: [],
            // @TODO: add relay
            relay: {
                type: 0,
                address: '',
                call: '',
            },
        }

        const message: MsgRegisterDaemon = {
            creator: address,
            daemon: payload,
        }

        this.logger.verbose('Payload', payload)

        await client.ValidationchainValidationchain.tx.sendMsgCreateDaemon(
            message
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
