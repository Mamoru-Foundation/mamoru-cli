import { exec } from 'node:child_process'

export const runCommand = async (cmd: string) => {
    const child = exec(cmd, (err) => {
        // eslint-disable-next-line no-console
        if (err) console.error(err)
    })
    child.stderr.pipe(process.stderr)
    child.stdout.pipe(process.stdout)
    await new Promise((resolve) => child.on('close', resolve))
}
