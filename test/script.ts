import { Object1 } from './core'

export function handleTransfer(): void {
    const arr: Array<number> = []

    for (let i = 0; i < 10; i++) {
        arr.push(i * 3)
    }
}

export function handleCreation(): void {}

export function handleCreation2(): Object1 {
    const obj2: Object1 = {
        field1: 1,
        field2: 'world',
        field3: new Map(),
    }

    return obj2
}
