/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Manifest } from '../types'
import { Client } from '@mamoru-ai/validation-chain-ts-client'
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing'
import { fromBase64 } from '@cosmjs/encoding'
import { Logger } from './console'
import {
    MsgRegisterDaemon,
    txClient,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/module'
import { CreateDaemonMetadataCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_create_command_dto'
import {
    DaemonMetadataContentQuery,
    DaemonMetadataType,
    DaemonMetadataContent,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import { DaemonRegisterCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_register_command_request_dto'
import {
    MsgCreateDaemonMetadata,
    MsgCreateDaemonMetadataResponse,
    MsgRegisterDaemonResponse,
    MsgRegisterSniffer,
    MsgRegisterSnifferResponse,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/tx'
import protobuf from 'protobufjs'
import { Chain_ChainType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { SnifferRegisterCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/sniffer_register_command_request_dto'
import { getAvailableChains } from './utils'

type TxMsgData = {
    msgResponses: AnyMsg[]
}

type AnyMsg = {
    typeUrl: string
    value: Uint8Array
}

type DeliverTxResponse = {
    code: number
    height: number
    rawLog?: string
    transactionHash: string
    gasUsed: number
    gasWanted: number
    data?: any
}

export type Msgs =
    | MsgRegisterDaemon
    | MsgCreateDaemonMetadata
    | TxMsgData
    | AnyMsg

export type ValidationChainMsgs =
    | MsgRegisterDaemon
    | MsgCreateDaemonMetadata
    | MsgCreateDaemonMetadataResponse
    | MsgRegisterDaemonResponse

class ValidationChainService {
    /**
     * ts-client types are broken, so using any for now
     */
    client: any
    wallet: DirectSecp256k1Wallet
    constructor(
        private readonly rpc: string,
        private readonly privateKey: string,
        private readonly logger: Logger
    ) {}

    private async getWallet() {
        if (this.wallet) return this.wallet
        const key = fromBase64(this.privateKey)
        const wallet = await DirectSecp256k1Wallet.fromKey(key)
        this.wallet = wallet
        return wallet
    }

    async registerDaemon(
        manifest: Manifest,
        daemonMetadataId: string
    ): Promise<MsgRegisterDaemonResponse> {
        this.logger.verbose('Registering daemon')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const payload: DaemonRegisterCommandRequestDTO = {
            chain: { chainType: this.getChainType(manifest) },
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

        const value: MsgRegisterDaemon = {
            creator: address,
            daemon: payload,
        }

        this.logger.verbose('Payload', payload)

        const r = await txClient.sendMsgRegisterDaemon({
            value,
        })
        this.throwOnError('MsgRegisterDaemon', r)

        const data: Uint8Array = r.data as unknown as Uint8Array

        const decodeTxMessages = this.decodeTxMessages(data)
        return decodeTxMessages[0] as MsgRegisterDaemonResponse
    }

    async registerSniffer(address: string, chain: Chain_ChainType) {
        const txClient = await this.getTxClient()

        const payload: SnifferRegisterCommandRequestDTO = {
            chains: [{ chainType: chain }],
            sniffer: address,
        }

        const message: MsgRegisterSniffer = {
            creator: address,
            sniffer: payload,
        }

        const result = await txClient.sendMsgRegisterSniffer({
            value: message,
        })

        this.throwOnError('MsgRegisterSniffer', result)

        const data: Uint8Array = result.data as unknown as Uint8Array

        const decodeTxMessages = this.decodeTxMessages(data)
        return decodeTxMessages[0] as MsgRegisterSnifferResponse
    }

    private async getClient(): Promise<any> {
        if (this.client) return this.client

        const wallet = await this.getWallet()
        console.log(this.rpc)
        this.client = new Client(
            {
                //@ts-ignore
                rpcURL: this.rpc || 'http://0.0.0.0:26657',

                apiURL: 'http://0.0.0.0:1317',
            },
            wallet
        )

        return this.client
    }

    private async getTxClient(): Promise<ReturnType<typeof txClient>> {
        const client = await this.getClient()
        return client.ValidationchainValidationchain.tx
    }

    private async getAddress() {
        const wallet = await this.getWallet()
        const accounts = await wallet.getAccounts()
        return accounts[0].address
    }

    async registerDaemonMetadata(
        manifest: Manifest,
        queries: DaemonMetadataContentQuery[],
        wasmModule?: string,
        gas?: string
    ): Promise<MsgCreateDaemonMetadataResponse> {
        this.logger.verbose('Registering daemon metadata')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const payload: CreateDaemonMetadataCommandRequestDTO = {
            logoUrl: manifest.logoUrl,
            metadataType: getSubcribableType(manifest),
            title: manifest.name,
            description: manifest.description,
            tags: manifest.tags,
            supportedChains: [{ chainType: this.getChainType(manifest) }],
            parameters: manifest.parameters,
            content: getDaemonContent(manifest, queries, wasmModule),
        }

        const message: MsgCreateDaemonMetadata = {
            creator: address,
            daemonMetadata: payload,
        }

        this.logger.verbose('message', message)

        const r = await txClient.sendMsgCreateDaemonMetadata({
            value: message,
            fee: {
                amount: [],
                gas: gas || '200000',
            },
        })
        this.throwOnError('MsgCreateDaemonMetadata', r)

        if (r.code) {
            throw new Error()
        }
        // @WARNING: this data only comes after hack the installed ts-client!!!
        const data: Uint8Array = r.data as unknown as Uint8Array
        const decodeTxMessages = this.decodeTxMessages(data)
        const msg = decodeTxMessages[0] as MsgCreateDaemonMetadataResponse

        return msg
    }

    private getDecoder(name = 'TxMsgData') {
        const parsedName = name.replace('/validationchain.validationchain.', '')
        /**
         * @TODO: instead of hardcode the schema, we should use the generated one from the client.
         * load from client that is placed in "@mamoru-ai/validation-chain-ts-client/proto"
         */
        const root = protobuf.parse(`
        syntax = "proto3";
        message Any {
            string type_url = 1;
            bytes value = 2;
        }

        message MsgCreateDaemonMetadataResponse {
            string daemonMetadataId = 1;
        }

        message MsgRegisterDaemonResponse {
            string daemonId = 1;
        }

        message TxMsgData {
            repeated Any msg_responses = 2;
        }
        `).root
        return root.lookupType(`.${parsedName}`)
    }

    private decodeProtobuf(name: string, data: Uint8Array): Msgs {
        const result: any = this.getDecoder(name).decode(data)

        return result
    }

    private decodeTxMessages(data: Uint8Array): ValidationChainMsgs[] {
        const result: TxMsgData = this.getDecoder().decode(data) as any

        return result.msgResponses.map(
            (msg) =>
                this.decodeProtobuf(
                    msg.typeUrl,
                    msg.value
                ) as ValidationChainMsgs
        )
    }

    private formatError(msgType: string, error: DeliverTxResponse) {
        const { code, rawLog } = error
        return `Error sending "${msgType}" code: "${code}", log: "${rawLog}" hash: "${error.transactionHash}"`
    }
    private throwOnError(MsgType: string, response: DeliverTxResponse) {
        if (response.code) {
            throw new Error(this.formatError(MsgType, response))
        }
        return response
    }
    /**
     * Get the chain type from the manifest.
     * Exported just for testing purposes
     * @returns
     */
    public getChainType(manifest: Manifest): Chain_ChainType {
        if (!manifest.chain) {
            throw new Error('Chain type not defined in manifest')
        }
        if (
            !getAvailableChains().includes(
                manifest.chain as unknown as Chain_ChainType
            )
        ) {
            throw new Error(
                `Chain type "${
                    manifest.chain
                }" not supported, supported values are: ${getAvailableChains().join(
                    ', '
                )}`
            )
        }
        return Chain_ChainType[
            manifest.chain as unknown as number
        ] as unknown as Chain_ChainType
    }

    /**
     * Utility function that can be used for debug messages from validation-chain protobuf API.
     * Uncomment if you need to debug messages.
     */
    private inspectMsgData(data: Uint8Array) {
        // console.log('----------------------------')
        // const buffer = Buffer.from(data)
        // const d = getData(buffer)
        // const schema = getProto(buffer)
        // console.log(schema)
        // console.log(JSON.stringify(d, null, 2), false, 100, true)
        // inspect(getData(Buffer.from()), false, 100, true)
        // console.log('----------------------------')
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
