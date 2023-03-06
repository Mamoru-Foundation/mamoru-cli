import * as fs from 'fs'
import path from 'path'
import { Command } from 'commander'
import colors from 'colors'
import manifestService from '../services/mainfest'
import Handlebars from 'handlebars'
import {
    ManifestEntityField,
    PublishedManifestEntityFieldType,
    ManifestEntityRelationType,
    PublishedManifestEntityField,
    ManifestEntityFieldType,
} from '../types'

const typeToNativeType: { [k: string]: string } = {
    boolean: 'boolean',

    int8: 'i8',
    int16: 'i16',
    int32: 'i32',
    int64: 'i64',
    uint8: 'u8',
    uint16: 'u16',
    uint32: 'u32',
    uint64: 'u64',
    float32: 'f32',
    float64: 'f64',
    decimal128: 'DecimalPrimitive',
    decimal256: 'DecimalPrimitive',
    biginteger: 'BigIntegerPrimitive',
    bigdecimal: 'DecimalPrimitive',
    time32: 'u32',
    time64: 'u64',
    date32: 'u32',
    date64: 'u64',
    binary: 'Array<u8>',
    fixedsizebinary: 'FixedSizeBinaryPrimitive',
    largebinary: 'Array<u8>',
    string: 'string',
    largestring: 'string',
}

const typeToValueType: { [k: string]: string } = {
    boolean: 'BooleanValue',

    int8: 'Int8Value',
    int16: 'Int16Value',
    int32: 'Int32Value',
    int64: 'Int64Value',
    uint8: 'UInt8Value',
    uint16: 'UInt16Value',
    uint32: 'UInt32Value',
    uint64: 'UInt64Value',
    float32: 'Float32Value',
    float64: 'Float64Value',
    decimal128: 'Decimal128Value',
    decimal256: 'Decimal256Value',
    biginteger: 'BigIntegerValue',
    bigdecimal: 'BigDecimalValue',
    time32: 'Time32Value',
    time64: 'Time64Value',
    date32: 'Date32Value',
    date64: 'Date64Value',
    binary: 'BinaryValue',
    fixedsizebinary: 'FixedSizeBinaryValue',
    largebinary: 'LargeBinaryValue',
    string: 'StringValue',
    largestring: 'LargeStringValue',
}

interface ComputedEntityField {
    name: string

    nativeType: string
    valueType: string
    structType: string

    relationType: ManifestEntityRelationType | null
    relationEntity: string | null

    nullable: boolean
    needNullable: boolean
    isComplex: boolean
    isUpdatable: boolean
}

enum ComputedEntityType {
    entity = 'entity',
    struct = 'struct',
    decimal128 = 'decimal128',
    decimal256 = 'decimal256',
    time32 = 'time32',
    time64 = 'time64',
    fixedSizeBinary = 'fixedSizeBinary',
}

interface ComputedEntity {
    name: string
    type: ComputedEntityType
    isExternalEntity: boolean
    meta: {
        scale?: number
        precision?: number
        size?: number
        unit?: string
        nullable?: boolean
    }
    fields: Array<ComputedEntityField>
}

function has(obj: any, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key)
}

function createFieldType(
    field: ManifestEntityField,
    namesPath: Array<string>,
    subTypes: Array<ComputedEntity>
): ComputedEntityField {
    let nativeType
    let valueType
    let nullable = true
    let needNullable = true
    let isComplex = false

    if (field.fields) {
        if (field.type.includes('!')) {
            nullable = false
        }

        const subType = createSubType(
            Array.from(namesPath).concat([
                `${field.name.slice(0, 1).toUpperCase()}${field.name.slice(1)}`,
            ]),
            field.fields,
            subTypes
        )

        nativeType = subType.name
        valueType = subType.name
        isComplex = true

        subTypes.push(subType)
    } else if (field.subType) {
        if (field.type.includes('!')) {
            nullable = false
        }

        const subType = createSubType(
            Array.from(namesPath).concat([
                `${field.name.slice(0, 1).toUpperCase()}${field.name.slice(1)}`,
            ]),
            [
                {
                    name: 'item',
                    ...field.subType,
                },
            ],
            subTypes
        )

        nativeType = `Array<${subType.name}>`
        valueType = `ListValue<${subType.name}>`

        isComplex = true

        subTypes.push(subType)
    } else {
        let rawType = field.type

        if (field.type.includes('!')) {
            nullable = false

            rawType = field.type.slice(0, -1)
        }

        if (rawType === 'decimal128' || rawType === 'decimal256') {
            const subtype = createDecimalSubType(
                Array.from(namesPath).concat([
                    `${field.name.slice(0, 1).toUpperCase()}${field.name.slice(
                        1
                    )}`,
                ]),
                rawType,
                field.scale,
                field.precision,
                nullable
            )

            subTypes.push(subtype)

            needNullable = false

            nativeType = 'DecimalPrimitive'
            valueType = subtype.name
        } else if (rawType === 'time32' || rawType === 'time64') {
            const subtype = createTimeSubType(
                Array.from(namesPath).concat([
                    `${field.name.slice(0, 1).toUpperCase()}${field.name.slice(
                        1
                    )}`,
                ]),
                rawType,
                field.unit,
                nullable
            )

            subTypes.push(subtype)

            needNullable = false

            nativeType = 'TimePrimitive'
            valueType = subtype.name
        } else if (rawType === 'fixedsizebinary') {
            const subtype = createFixedSizeBinary(
                Array.from(namesPath).concat([
                    `${field.name.slice(0, 1).toUpperCase()}${field.name.slice(
                        1
                    )}`,
                ]),
                rawType,
                field.size,
                nullable
            )

            subTypes.push(subtype)

            needNullable = false
            nativeType = 'FixedSizeBinaryPrimitive'
            valueType = subtype.name
        } else {
            nativeType = typeToNativeType[rawType]
            valueType = typeToValueType[rawType]
        }
    }

    return {
        name: field.name,

        nativeType,
        valueType,
        structType: valueType,

        relationType: null,
        relationEntity: null,
        nullable,
        needNullable,
        isComplex,
        isUpdatable: true,
    }
}

function convertPublishedTypeToFieldType(
    fieldType: PublishedManifestEntityFieldType
): ManifestEntityFieldType {
    let type: string
    let subType: ManifestEntityFieldType
    let required = false
    let precision: number
    let scale: number
    let size: number
    let unit: 'Second' | 'Millisecond' | 'Microsecond' | 'Nanosecond'
    let fields: Array<ManifestEntityField>

    if (has(fieldType, 'boolean')) {
        type = 'boolean'
        required = fieldType.boolean
    } else if (has(fieldType, 'int8')) {
        type = 'int8'
        required = fieldType.int8
    } else if (has(fieldType, 'int16')) {
        type = 'int16'
        required = fieldType.int16
    } else if (has(fieldType, 'int32')) {
        type = 'int32'
        required = fieldType.int32
    } else if (has(fieldType, 'int64')) {
        type = 'int64'
        required = fieldType.int64
    } else if (has(fieldType, 'uint8')) {
        type = 'uint8'
        required = fieldType.uint8
    } else if (has(fieldType, 'uint16')) {
        type = 'uint16'
        required = fieldType.uint16
    } else if (has(fieldType, 'uint32')) {
        type = 'uint32'
        required = fieldType.uint32
    } else if (has(fieldType, 'uint64')) {
        type = 'uint64'
        required = fieldType.uint64
    } else if (has(fieldType, 'float32')) {
        type = 'float32'
        required = fieldType.float32
    } else if (has(fieldType, 'float64')) {
        type = 'float64'
        required = fieldType.float64
    } else if (has(fieldType, 'decimal128')) {
        type = 'decimal128'
        required = fieldType.decimal128[0]
        precision = fieldType.decimal128[1]
        scale = fieldType.decimal128[2]
    } else if (has(fieldType, 'decimal256')) {
        type = 'decimal256'
        required = fieldType.decimal256[0]
        precision = fieldType.decimal256[1]
        scale = fieldType.decimal256[2]
    } else if (has(fieldType, 'biginteger')) {
        type = 'biginteger'
        required = fieldType.biginteger[0]
        size = fieldType.biginteger[1]
    } else if (has(fieldType, 'bigdecimal')) {
        type = 'bigdeimal'
        required = fieldType.bigdecimal[0]
        precision = fieldType.bigdecimal[1]
        scale = fieldType.bigdecimal[2]
    } else if (has(fieldType, 'time32')) {
        type = 'time32'
        required = fieldType.time32[0]
        unit = fieldType.time32[1]
    } else if (has(fieldType, 'time64')) {
        type = 'time64'
        required = fieldType.time64[0]
        unit = fieldType.time64[1]
    } else if (has(fieldType, 'date32')) {
        type = 'date32'
        required = fieldType.date32
    } else if (has(fieldType, 'date64')) {
        type = 'date64'
        required = fieldType.date64
    } else if (has(fieldType, 'binary')) {
        type = 'binary'
        required = fieldType.binary
    } else if (has(fieldType, 'fixedsizebinary')) {
        type = 'fixedsizebinary'
        required = fieldType.fixedsizebinary[0]
        size = fieldType.fixedsizebinary[1]
    } else if (has(fieldType, 'largebinary')) {
        type = 'largebinary'
        required = fieldType.largebinary
    } else if (has(fieldType, 'string')) {
        type = 'string'
        required = fieldType.string
    } else if (has(fieldType, 'largestring')) {
        type = 'largestring'
        required = fieldType.largestring
    } else if (has(fieldType, 'list')) {
        type = 'list'
        required = fieldType.list[0]

        subType = convertPublishedTypeToFieldType(fieldType.list[1])
    } else if (has(fieldType, 'struct')) {
        type = 'struct'
        required = fieldType.struct[0]

        fields = []

        for (let i = 0; i < fieldType.struct[1].length; i++) {
            fields.push(convertPublishedTypeToField(fieldType.struct[1][i]))
        }
    }

    return {
        type: `${type}${required ? '!' : ''}`,
        scale,
        precision,
        size,
        unit,
        subType,
        fields,
    }
}

function convertPublishedTypeToField(
    field: PublishedManifestEntityField
): ManifestEntityField {
    const type = convertPublishedTypeToFieldType(field.type)

    return {
        name: field.name,
        ...type,
    }
}

function createDecimalSubType(
    names: Array<string>,
    rawType: string,
    scale: number,
    precision: number,
    nullable: boolean
): ComputedEntity {
    let entityType: ComputedEntityType
    let suffix: string

    if (rawType === 'decimal128') {
        entityType = ComputedEntityType.decimal128
        suffix = 'Decimal128'
    } else if (rawType === 'decimal256') {
        entityType = ComputedEntityType.decimal256
        suffix = 'Decimal256'
    } else {
        throw new Error('Unknown decimal')
    }

    return {
        name: `${names.join('')}${suffix}`,
        type: entityType,
        isExternalEntity: false,
        meta: {
            scale,
            precision,
            nullable,
        },
        fields: [],
    }
}

function createTimeSubType(
    names: Array<string>,
    rawType: string,
    unit: 'Second' | 'Millisecond' | 'Microsecond' | 'Nanosecond',
    nullable: boolean
): ComputedEntity {
    let entityType: ComputedEntityType
    let suffix: string

    if (rawType === 'time32') {
        entityType = ComputedEntityType.time32
        suffix = 'Time32'
    } else if (rawType === 'time64') {
        entityType = ComputedEntityType.time64
        suffix = 'Time64'
    } else {
        throw new Error('Unknown decimal')
    }

    return {
        name: `${names.join('')}${suffix}`,
        type: entityType,
        isExternalEntity: false,
        meta: {
            unit,
            nullable,
        },
        fields: [],
    }
}

function createFixedSizeBinary(
    names: Array<string>,
    rawType: string,
    size: number,
    nullable: boolean
): ComputedEntity {
    return {
        name: `${names.join('')}FixedSizeBinary`,
        type: ComputedEntityType.fixedSizeBinary,
        isExternalEntity: false,
        meta: {
            size,
            nullable,
        },
        fields: [],
    }
}

function createSubType(
    names: Array<string>,
    fields: Array<ManifestEntityField>,
    subTypes: Array<ComputedEntity>
): ComputedEntity {
    const computedEntity: ComputedEntity = {
        name: `${names.join('')}Struct`,
        type: ComputedEntityType.struct,
        isExternalEntity: false,
        meta: {},
        fields: [],
    }

    for (const field of fields) {
        computedEntity.fields.push(
            createFieldType(field, Array.from(names).concat('Struct'), subTypes)
        )
    }

    return computedEntity
}

async function codegen(
    program: Command,
    projectPath: string,
    ipfsDaemonUrl: string
) {
    const verbosity = program.opts().verbose

    console.log(colors.green('Validating Queryable manifest'))

    const { manifest, entities: namedEntities } =
        await manifestService.readAndValidateManifest(
            program,
            ipfsDaemonUrl,
            projectPath,
            verbosity,
            true
        )

    const entities: Array<ComputedEntity> = []

    for (const entity of manifest.entities) {
        const calculatedEntity: ComputedEntity = {
            name: entity.name,
            type: ComputedEntityType.entity,
            isExternalEntity: false,
            meta: {},
            fields: [
                {
                    name: '_id',
                    nativeType: 'u64',
                    valueType: 'UInt64Value',
                    structType: 'UInt64Value',
                    relationType: null,
                    relationEntity: null,
                    nullable: false,
                    needNullable: true,
                    isComplex: false,
                    isUpdatable: false,
                },
            ],
        }

        if (entity.relations) {
            for (const relation of entity.relations) {
                if (
                    relation.type === ManifestEntityRelationType.oneToOne ||
                    relation.type === ManifestEntityRelationType.manyToOne
                ) {
                    calculatedEntity.fields.push({
                        name: relation.localFieldName,
                        nativeType: `${relation.entity.replace(
                            /\//g,
                            '_'
                        )}Entity`,
                        valueType: `${relation.entity.replace(
                            /\//g,
                            '_'
                        )}Entity`,
                        structType: `UInt64Value`,
                        relationType: relation.type,
                        relationEntity: relation.entity,
                        nullable: relation.nullable,
                        needNullable: true,
                        isComplex: false,
                        isUpdatable: true,
                    })
                } else if (
                    relation.type === ManifestEntityRelationType.oneToMany ||
                    relation.type === ManifestEntityRelationType.manyToMany
                ) {
                    calculatedEntity.fields.push({
                        name: relation.localFieldName,
                        nativeType: `Array<${relation.entity.replace(
                            /\//g,
                            '_'
                        )}Entity>`,
                        valueType: `ListValue<${relation.entity.replace(
                            /\//g,
                            '_'
                        )}Entity>`,
                        structType: `ListValue<UInt64Value>`,
                        relationType: relation.type,
                        relationEntity: relation.entity,
                        nullable: relation.nullable,
                        needNullable: true,
                        isComplex: false,
                        isUpdatable: true,
                    })
                }
            }
        }

        for (const field of entity.fields) {
            const subTypes: Array<ComputedEntity> = []

            calculatedEntity.fields.push(
                createFieldType(field, [entity.name], subTypes)
            )

            for (const subType of subTypes) {
                entities.push(subType)
            }
        }

        entities.push(calculatedEntity)
    }

    for (const entityKey of Object.keys(namedEntities)) {
        const entity = namedEntities[entityKey]

        const calculatedEntity: ComputedEntity = {
            name: entityKey.replace(/\//g, '_'),
            type: ComputedEntityType.entity,
            isExternalEntity: true,
            meta: {},
            fields: [],
        }

        const relationFields: Array<string> = []

        for (const relation of entity.relations) {
            relationFields.push(relation.localFieldName)

            if (
                relation.type === ManifestEntityRelationType.oneToOne ||
                relation.type === ManifestEntityRelationType.manyToOne
            ) {
                calculatedEntity.fields.push({
                    name: relation.localFieldName,
                    nativeType: `${relation.entity.replace(/\//g, '_')}Entity`,
                    valueType: `${relation.entity.replace(/\//g, '_')}Entity`,
                    structType: `UInt64Value`,
                    relationType: relation.type,
                    relationEntity: relation.entity.replace(/\//g, '_'),
                    nullable: relation.nullable,
                    needNullable: true,
                    isComplex: false,
                    isUpdatable: true,
                })
            } else if (
                relation.type === ManifestEntityRelationType.oneToMany ||
                relation.type === ManifestEntityRelationType.manyToMany
            ) {
                calculatedEntity.fields.push({
                    name: relation.localFieldName,
                    nativeType: `Array<${relation.entity.replace(
                        /\//g,
                        '_'
                    )}Entity>`,
                    valueType: `ListValue<${relation.entity.replace(
                        /\//g,
                        '_'
                    )}Entity>`,
                    structType: `ListValue<UInt64Value>`,
                    relationType: relation.type,
                    relationEntity: relation.entity.replace(/\//g, '_'),
                    nullable: relation.nullable,
                    needNullable: true,
                    isComplex: false,
                    isUpdatable: true,
                })
            }
        }

        for (const field of entity.fieldsSchema) {
            if (relationFields.includes(field.name)) {
                continue
            }

            const subTypes: Array<ComputedEntity> = []

            const fieldType = createFieldType(
                convertPublishedTypeToField(field),
                entityKey.split('/'),
                subTypes
            )

            fieldType.isUpdatable = false

            calculatedEntity.fields.push(fieldType)

            for (const subType of subTypes) {
                entities.push(subType)
            }
        }

        entities.push(calculatedEntity)
    }

    const entitiesSource = fs
        .readFileSync('src/templates/entities.hbs')
        .toString('utf-8')
    const entitySource = fs
        .readFileSync('src/templates/entity.hbs')
        .toString('utf-8')
    const structSource = fs
        .readFileSync('src/templates/struct.hbs')
        .toString('utf-8')
    const decimalSource = fs
        .readFileSync('src/templates/decimal.hbs')
        .toString('utf-8')
    const fixedSizeBinarySource = fs
        .readFileSync('src/templates/fixed-size-binary.hbs')
        .toString('utf-8')
    const timeSource = fs
        .readFileSync('src/templates/time.hbs')
        .toString('utf-8')
    const primitiveFieldSource = fs
        .readFileSync('src/templates/primitive-field.hbs')
        .toString('utf-8')
    const relationalFieldSource = fs
        .readFileSync('src/templates/relational-field.hbs')
        .toString('utf-8')

    Handlebars.registerPartial('entity', entitySource)
    Handlebars.registerPartial('struct', structSource)
    Handlebars.registerPartial('decimal', decimalSource)
    Handlebars.registerPartial('fixedSizeBinary', fixedSizeBinarySource)
    Handlebars.registerPartial('time', timeSource)
    Handlebars.registerPartial('primitiveField', primitiveFieldSource)
    Handlebars.registerPartial('relationalField', relationalFieldSource)
    Handlebars.registerHelper(
        'capitalizeFieldName',
        function (fieldName: string) {
            return new Handlebars.SafeString(
                `${fieldName.slice(0, 1).toUpperCase()}${fieldName.slice(1)}`
            )
        }
    )

    Handlebars.registerHelper(
        'ifeq',
        function (leftArgument, rightArgument, options) {
            if (leftArgument === rightArgument) {
                return options.fn(this)
            }
            return options.inverse(this)
        }
    )

    const template = Handlebars.compile(entitiesSource)

    console.log('Entities', JSON.stringify(entities))

    const result = template({
        entities,
    })

    const entitiesCompiledPath = path.join(projectPath, 'entities.ts')

    fs.writeFileSync(entitiesCompiledPath, result)

    console.log(colors.green('Done!'))
}

export default {
    codegen,
}
