import { exec } from 'node:child_process'

export const runCommand = (cmd: string) => {
    return new Promise((resolve, reject) => {
        const child = exec(cmd, (err) => {
            // eslint-disable-next-line no-console
            if (err) {
                reject(err)
            }
            resolve(undefined)
        })
        child.stderr.pipe(process.stderr)
        child.stdout.pipe(process.stdout)
    })
}
