/* eslint-disable no-console */
import colors from 'colors'

export class Logger {
    level: number
    constructor(level: number) {
        this.level = level
    }
    verbose(...rest: any[]) {
        if (process.env.NODE_ENV === 'test') return
        if (this.level > 0) {
            const args = rest.map((arg) => colors.grey(arg))
            console.log(...args)
        }
    }
    ok(...rest: any[]) {
        if (process.env.NODE_ENV === 'test') return
        const args = rest.map((arg) => colors.green(arg))
        console.log(...args)
    }
    log(...rest: any[]) {
        if (process.env.NODE_ENV === 'test') return
        console.log(...rest)
    }
    error(...rest: any[]) {
        if (process.env.NODE_ENV === 'test') return
        const args = rest.map((arg) => colors.red(arg))
        console.error(...args)
    }
}
