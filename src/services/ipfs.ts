// eslint-disable-next-line @typescript-eslint/no-var-requires
const ipfsHttpClient = require('ipfs-http-client')

async function getFileFromIpfs(
    ipfsDaemonUrl: string,
    ipfsPath: string
): Promise<string> {
    const client = ipfsHttpClient.create({ url: ipfsDaemonUrl })

    const arr = []

    for await (const entry of client.cat(ipfsPath)) {
        arr.push(entry.toString('utf-8'))
    }

    return arr.join('')
}

export default {
    getFileFromIpfs,
}
