export class ManifestDatasource {
    name: string
    ipfsPath: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: any
}

export class ManifestJobDatasource {
    name: string
    entity: string
}

export class ManifestJob {
    name: string
    timeWindow?: number
    module: string
    abis: Array<string>
    handlers: Array<{
        method: string
        dataSources: Array<ManifestJobDatasource>
    }>
    isTemplate: boolean
}

export interface PublishedManifestEntityFieldType {
    boolean: boolean
    int8: boolean
    int16: boolean
    int32: boolean
    int64: boolean
    uint8: boolean
    uint16: boolean
    uint32: boolean
    uint64: boolean
    float32: boolean
    float64: boolean

    decimal128: [boolean, number, number]
    decimal256: [boolean, number, number]

    biginteger: [boolean, number]
    bigdecimal: [boolean, number, number]

    time32: [boolean, 'Second' | 'Millisecond' | 'Microsecond' | 'Nanosecond']
    time64: [boolean, 'Second' | 'Millisecond' | 'Microsecond' | 'Nanosecond']

    date32: boolean
    date64: boolean

    binary: boolean
    fixedsizebinary: [boolean, number]
    largebinary: boolean

    string: boolean
    largestring: boolean

    list: [boolean, PublishedManifestEntityFieldType]
    struct: [boolean, Array<PublishedManifestEntityField>]
}

export class PublishedManifestEntityField {
    name: string
    type: PublishedManifestEntityFieldType
}

export class ManifestEntityFieldType {
    type: string
    scale: number
    precision: number
    size: number
    unit: 'Second' | 'Millisecond' | 'Microsecond' | 'Nanosecond'
    subType: ManifestEntityFieldType
    fields: Array<ManifestEntityField>
}

export class ManifestEntityField extends ManifestEntityFieldType {
    name: string
}

export enum ManifestEntityRelationType {
    oneToOne = 'one-to-one',
    oneToMany = 'one-to-many',
    manyToOne = 'many-to-one',
    manyToMany = 'many-to-many',
}

export class ManifestEntityRelation {
    localFieldName: string
    dataSource: string
    entity: string
    remoteFieldName: string
    type: ManifestEntityRelationType
    eagerFetch: boolean
    nullable: boolean
}

export class ManifestEntity {
    name: string
    fields: Array<ManifestEntityField>
    relations: Array<ManifestEntityRelation>
}

export class Manifest {
    version: number
    name: number
    description: string
    logoUrl: number
    dataSources: Array<ManifestDatasource>
    entities: Array<ManifestEntity>
    jobs: Array<ManifestJob>
}

export class PublishedDataSourceItemEntity {
    name: string
    relations: Array<{
        localFieldName: string
        entity: string
        remoteFieldName: string
        type: ManifestEntityRelationType
        eagerFetch: true
        nullable: false
    }>
    fieldsSchema: Array<PublishedManifestEntityField>
    parquetSchema: string
    arrowSchema: string
    encodings: { [fieldName: string]: string }
}

export class PublishedDataSourceItem {
    version: string
    description: string
    entities: { [entityName: string]: PublishedDataSourceItemEntity }
    data: {
        [entityName: string]: Array<{
            startTime: number
            endTime: number
            startBlock: string
            endBlock: string
            startId: number
            endId: number
            ipfsCid: string
            size: number
            createdAt: number
        }>
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: { [key: string]: any }
}
