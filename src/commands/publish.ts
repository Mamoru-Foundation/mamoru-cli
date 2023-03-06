import type { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import { create } from 'ipfs-http-client'
import axios from 'axios'

import manifest from '../services/mainfest'
import colors from 'colors'

async function publish(
    program: Command,
    queryableProjectPath: string,
    queryableServerUrl: string,
    ipfsDaemonUrl: string
) {
    const verbosity = program.opts().verbose

    const buildPath = path.join(queryableProjectPath, '.queryable')

    if (!fs.existsSync(buildPath)) {
        program.error('Project is not compiled, compile it first')
    }

    console.log(colors.green('Validating Queryable manifest'))

    const content = (
        await manifest.readAndValidateManifest(
            program,
            ipfsDaemonUrl,
            buildPath,
            verbosity,
            true
        )
    ).content

    console.log(colors.green('Publishing to IPFS'))

    const url = new URL(ipfsDaemonUrl)

    const client = create({ url })

    const { cid } = await client.add(content)

    const ipfsPath = `/ipfs/${cid.toString()}`

    console.log(colors.green('Published to IPFS'), ipfsPath)

    let apiUrl: string

    if (ipfsDaemonUrl === 'https://api.queryable.com/') {
        console.log(colors.green('Registering on Queryable'))

        apiUrl = `${queryableServerUrl}/management/jobs`
    } else {
        console.log(colors.green('Registering on Queryable server'))

        apiUrl = `${queryableServerUrl}/management/jobs`
    }

    try {
        await axios.post(apiUrl, {
            source_type: 'Queryable',
            ipfs_path: ipfsPath,
        })
    } catch (error) {
        if (error.response && error.response.data) {
            if (verbosity > 1) {
                console.log(colors.grey('Received response'))
                console.log(JSON.stringify(error.response.data))
            }

            program.error(
                `Project failed to register, reason: ${error.response.data.message}`
            )
        }
    }

    console.log(colors.green('Done!'))
}

export default {
    publish,
}
