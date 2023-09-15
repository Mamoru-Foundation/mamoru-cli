import path from 'path'
import fs from 'fs'
import { RcConfig } from '../../types'
import { homedir } from 'os'

function getHomeDirectory(): string {
    return homedir()
}

function createRcConfigDirectory() {
    const rcDirectory = path.join(getHomeDirectory(), '.mamorurc')
    if (!fs.existsSync(rcDirectory)) {
        fs.mkdirSync(rcDirectory)
    }
}

function getRcConfigPath(): string {
    return path.join(getHomeDirectory(), '.mamorurc', 'config.json')
}

export function readRcConfig(): RcConfig {
    const rcPath = getRcConfigPath()
    if (fs.existsSync(rcPath)) {
        const rcConfigString = fs.readFileSync(rcPath, 'utf-8')
        try {
            const rcConfigJson = JSON.parse(rcConfigString)
            return rcConfigJson || {}
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error parsing rc config file', err)
            return {}
        }
    }
    return {}
}

export function writeRcConfig(rcConfig: RcConfig) {
    const rcPath = getRcConfigPath()
    const rcConfigString = JSON.stringify(rcConfig, null, 2)
    createRcConfigDirectory()
    fs.writeFileSync(rcPath, rcConfigString)
}
/**
 * Remove the rc config file, useful for tests
 */
export function removeRcConfig() {
    const rcPath = getRcConfigPath()
    fs.existsSync(rcPath) && fs.unlinkSync(rcPath)
}
