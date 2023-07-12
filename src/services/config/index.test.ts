import { describe, expect, it } from '@jest/globals'
import { readRcConfig, removeRcConfig, writeRcConfig } from './index'


describe('readRcConfig', () => {
  it('should return empty object if rc config file does not exist', () => {
    removeRcConfig()
    const rcConfig = readRcConfig()

    expect(rcConfig).toEqual({})
  })
  it('should return rc config if rc config file exists', () => {
    removeRcConfig()
    const template = {
      telemetry: false
    }
    writeRcConfig(template)
    const rcConfig = readRcConfig()
    expect(rcConfig).toEqual(template)
  })
})

