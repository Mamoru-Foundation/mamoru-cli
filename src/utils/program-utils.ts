import { Option } from 'commander'

export const rpcOption = new Option('--rpc <rpcUrl>', 'RPC URL of the chain')
    .default('http://localhost:26657')
    .env('MAMORU_RPC_URL')

export const privateKeyOption = new Option(
    '-k, --private-key <key>',
    'Private key of the account that will be used to publish the project'
)
    .makeOptionMandatory()
    .env('MAMORU_PRIVATE_KEY')
