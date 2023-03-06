import colors from 'colors'

export class Logger {
    level: number
    constructor(level: number) {
        this.level = level
    }
    verbose(...rest: any[]) {
        if (this.level > 0) {
            const args = rest.map((arg) => colors.grey(arg))
            console.log(...args)
        }
    }
    ok(...rest: any[]) {
        const args = rest.map((arg) => colors.green(arg))
        console.log(...args)
    }
    log(...rest: any[]) {
        console.log(...rest)
    }
}
