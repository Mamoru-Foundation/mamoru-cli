import type { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import { create } from 'ipfs-http-client'
import axios from 'axios'

import manifest from '../services/mainfest-old'
import colors from 'colors'
import { Logger } from '../services/console'
import { validateAndReadManifest } from '../services/manifest'
import { OUT_DIR } from '../services/constants'
import { WebsocketClient } from '@cosmjs/tendermint-rpc'

export interface PublishOptions {
    rpcUrl: string
    key: string
}

async function publish(
    program: Command,
    projectPath: string,
    options: PublishOptions
) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)

    const buildPath = path.join(projectPath, OUT_DIR)

    if (!fs.existsSync(buildPath))
        program.error(
            'Project is not compiled, compile it first, use "mamoru-cli build"'
        )

    logger.ok('Validating Queryable manifest')

    const manifest = validateAndReadManifest(logger, program, buildPath)

    logger.ok('Publishing to IPFS')

    // const url = new URL(ipfsDaemonUrl)

    // const client = create({ url })

    // const { cid } = await client.add(content)

    // const ipfsPath = `/ipfs/${cid.toString()}`

    // console.log(colors.green('Published to IPFS'), ipfsPath)

    // let apiUrl: string

    // if (ipfsDaemonUrl === 'https://api.queryable.com/') {
    //     console.log(colors.green('Registering on Queryable'))

    //     apiUrl = `${queryableServerUrl}/management/jobs`
    // } else {
    //     console.log(colors.green('Registering on Queryable server'))

    //     apiUrl = `${queryableServerUrl}/management/jobs`
    // }

    // try {
    //     await axios.post(apiUrl, {
    //         source_type: 'Queryable',
    //         ipfs_path: ipfsPath,
    //     })
    // } catch (error) {
    //     if (error.response && error.response.data) {
    //         if (verbosity > 1) {
    //             console.log(colors.grey('Received response'))
    //             console.log(JSON.stringify(error.response.data))
    //         }

    //         program.error(
    //             `Project failed to register, reason: ${error.response.data.message}`
    //         )
    //     }
    // }

    logger.ok('Published successfully')
}

export default {
    publish,
}
