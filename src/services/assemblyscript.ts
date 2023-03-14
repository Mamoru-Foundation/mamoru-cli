import fs from 'fs'

export function prepareBinaryFile(binaryFilePath: string): string {
    const base64 = convertBinaryFileToBase64(binaryFilePath)
    return base64
}

function convertBinaryFileToBase64(binaryFilePath: string): string {
    const binary = fs.readFileSync(binaryFilePath)
    const base64 = Buffer.from(binary).toString('base64')
    return base64
}
