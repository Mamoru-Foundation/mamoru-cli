import {
    Manifest,
    ManifestEntityRelationType,
    PublishedDataSourceItem,
    ManifestEntity,
    PublishedDataSourceItemEntity,
} from '../types'

import * as fs from 'fs'
import * as path from 'path'
import type { Command } from 'commander'
import * as yaml from 'yaml'
import joi from 'joi'
import colors from 'colors'

import ipfs from './ipfs'

const comparisonFilterSchema = joi
    .object()
    .keys({
        comparison: joi.object().keys({
            fieldRef: joi.string().required(),
            operator: joi
                .string()
                .valid('==', '!=', 'in', 'not in', '<', '<=', '>', '>=')
                .required(),
            value: joi.alternatives(joi.number(), joi.string()).required(),
        }),
    })
    .id('comparisonFilter')

const conditionalFilterSchema = joi
    .object()
    .keys({
        conditional: joi.object().keys({
            operator: joi.string().valid('and', 'or').required(),
            left: joi.alternatives(
                comparisonFilterSchema,
                joi.link('#conditionalFilter')
            ),
            right: joi.alternatives(
                comparisonFilterSchema,
                joi.link('#conditionalFilter')
            ),
        }),
    })
    .id('conditionalFilter')

const fieldTypeRegex =
    /^(boolean|int8|int16|int32|int64|uint8|uint16|uint32|uint64|float32|float64|decimal128|decimal256|biginteger|bigdecimal|time32|time64|date32|date64|binary|fixedsizebinary|largebinary|string|largestring|list|struct){1}[!]{0,1}$/

const validNameRegex = /^[A-Za-z_]{1}[A-Za-z0-9_]*$/
const validNameWithDatasourceRegex = validNameRegex
// /^[A-Za-z_]{1}[A-Za-z0-9_]*(\/[A-Za-z_]{1}[A-Za-z0-9_]*)+$/
const ipfsPathRegex = /^\/(ipfs|ipns)\/[A-Za-z0-9]+$/

const fieldTypeSchema = joi
    .object()
    .keys({
        type: joi.string().regex(fieldTypeRegex).required(),
        scale: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^(decimal128|decimal256){1}[!]{0,1}$/),
            then: joi.number().integer().max(255),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
        precision: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^(decimal128|decimal256){1}[!]{0,1}$/),
            then: joi.number().integer().max(255),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
        subType: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^list{1}[!]{0,1}$/),
            then: joi.link().ref('#fieldType'),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
        fields: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^struct{1}[!]{0,1}$/),
            then: joi.array().items(joi.link().ref('#field')),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
    })
    .id('fieldType')

const fieldSchema = joi
    .object()
    .keys({
        name: joi.string().regex(validNameRegex).required(),
        type: joi.string().regex(fieldTypeRegex).required(),
        scale: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^(decimal128|decimal256){1}[!]{0,1}$/),
            then: joi.number().integer().max(255),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
        precision: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^(decimal128|decimal256){1}[!]{0,1}$/),
            then: joi.number().integer().max(255),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
        subType: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^list{1}[!]{0,1}$/),
            then: joi.link().ref('#fieldType'),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
        fields: joi.alternatives().conditional('type', {
            is: joi.string().regex(/^struct{1}[!]{0,1}$/),
            then: joi.array().items(joi.link().ref('#field')),
            otherwise: joi.alternatives(joi.allow(null), joi.forbidden()),
        }),
    })
    .id('field')
    .shared(fieldTypeSchema)

const queryableManifestSchema = joi
    .object()
    .keys({
        version: joi.any().valid('0.1', 0.1).required(),
        name: joi.string().required(),
        description: joi.string().optional(),
        logoUrl: joi
            .string()
            .uri({ scheme: ['http', 'https'] })
            .optional(),
        dataSources: joi.array().items(
            joi.object().keys({
                name: joi.string().regex(validNameRegex).required(),
                ipfsPath: joi.string().regex(ipfsPathRegex).required(),
                filter: joi.alternatives(
                    joi.link('#comparisonFilter'),
                    joi.link('#conditionalFilter')
                ),
            })
        ),
        entities: joi
            .array()
            .items(
                joi.object().keys({
                    name: joi.string().regex(validNameRegex).required(),
                    fields: joi.array().items(joi.link('#field')).required(),
                    relations: joi.array().items(
                        joi.object().keys({
                            dataSource: joi
                                .string()
                                .regex(validNameRegex)
                                .optional(),
                            entity: joi
                                .string()
                                .regex(validNameRegex)
                                .required(),
                            type: joi
                                .string()
                                .valid(
                                    ManifestEntityRelationType.oneToOne,
                                    ManifestEntityRelationType.oneToMany,
                                    ManifestEntityRelationType.manyToOne,
                                    ManifestEntityRelationType.manyToMany
                                )
                                .required(),
                            localFieldName: joi
                                .string()
                                .regex(validNameRegex)
                                .optional(),
                            remoteFieldName: joi
                                .string()
                                .regex(validNameRegex)
                                .optional()
                                .default('_id'),
                            eagerFetch: joi.boolean().optional().default(false),
                            nullable: joi.boolean().default(false),
                        })
                    ),
                })
            )
            .required(),
        jobs: joi.array().items(
            joi.object().keys({
                name: joi.alternatives().conditional('isTemplate', {
                    is: joi.boolean().truthy(),
                    then: joi.string().regex(validNameRegex).required(),
                    otherwise: joi.string(),
                }),
                timeWindow: joi.number().integer().positive().optional(),
                module: joi.string().required(),
                abis: joi.array().items(joi.string()).optional().default([]),
                handlers: joi
                    .array()
                    .items(
                        joi.object().keys({
                            method: joi
                                .string()
                                .regex(validNameRegex)
                                .required(),
                            dataSources: joi
                                .array()
                                .items(
                                    joi.object().keys({
                                        name: joi
                                            .string()
                                            .regex(validNameRegex)
                                            .required(),
                                        entity: joi
                                            .string()
                                            .regex(validNameRegex)
                                            .required(),
                                    })
                                )
                                .required(),
                        })
                    )
                    .min(1),
                isTemplate: joi.boolean().optional(),
            })
        ),
    })
    .shared(comparisonFilterSchema)
    .shared(conditionalFilterSchema)
    .shared(fieldSchema)

const publishedQueryableManifestSchemaEntityFieldType = joi
    .alternatives(
        joi
            .object()
            .keys({
                boolean: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                int8: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                int16: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                int32: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                int64: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                uint8: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                uint16: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                uint32: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                uint64: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                float32: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                float64: joi.boolean().required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                decimal128: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi.number().integer().min(0).max(255).required(),
                        joi.number().integer().min(0).max(255).required()
                    )
                    .required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                decimal256: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi.number().integer().min(0).max(255).required(),
                        joi.number().integer().min(0).max(255).required()
                    )
                    .required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                biginteger: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi.number().integer().min(0).max(65535).required()
                    )
                    .required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                bigdecimal: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi.number().integer().min(0).max(255).required(),
                        joi.number().integer().min(0).max(255).required()
                    )
                    .required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                time32: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi
                            .string()
                            .allow(
                                'Second',
                                'Millisecond',
                                'Microsecond',
                                'Nanosecond'
                            )
                            .required()
                    )
                    .required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                time64: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi
                            .string()
                            .allow(
                                'Second',
                                'Millisecond',
                                'Microsecond',
                                'Nanosecond'
                            )
                            .required()
                    )
                    .required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                date32: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                date64: joi.boolean().required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                binary: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                fixedsizebinary: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi.number().min(0).max(4294967295).required()
                    )
                    .required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                largebinary: joi.boolean().required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                string: joi.boolean().required(),
            })
            .optional(),
        joi
            .object()
            .keys({
                largestring: joi.boolean().required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                list: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi.link('#publishedType')
                    )
                    .required(),
            })
            .optional(),

        joi
            .object()
            .keys({
                struct: joi
                    .array()
                    .ordered(
                        joi.boolean().required(),
                        joi
                            .array()
                            .items(
                                joi.object().keys({
                                    name: joi
                                        .string()
                                        .regex(validNameRegex)
                                        .required(),
                                    type: joi.link('#type'),
                                })
                            )
                            .required()
                    )
                    .required(),
            })
            .optional()
    )
    .id('publishedType')

const publishedQueryableManifestSchemaEntityField = joi
    .object()
    .keys({
        name: joi.string().regex(validNameRegex).required(),
        type: joi.link('#publishedType'),
    })
    .id('publishedField')
    .shared(publishedQueryableManifestSchemaEntityFieldType)

const publishedQueryableManifestSchema = joi
    .object()
    .keys({
        version: joi.any().valid('0.1', 0.1).required(),
        name: joi.string().optional(),
        description: joi.string().optional(),
        logoUrl: joi
            .string()
            .uri({ scheme: ['http', 'https'] })
            .optional(),
        entities: joi
            .object()
            .pattern(validNameRegex, {
                name: joi.string().regex(validNameRegex).required(),
                relations: joi.array().items(
                    joi.object().keys({
                        entity: joi
                            .string()
                            .regex(validNameWithDatasourceRegex)
                            .required(),
                        localFieldName: joi
                            .string()
                            .regex(validNameRegex)
                            .required(),
                        remoteFieldName: joi
                            .string()
                            .regex(validNameRegex)
                            .required(),
                        type: joi
                            .string()
                            .valid(
                                ManifestEntityRelationType.oneToOne,
                                ManifestEntityRelationType.oneToMany,
                                ManifestEntityRelationType.manyToOne,
                                ManifestEntityRelationType.manyToMany
                            )
                            .required(),
                        eagerFetch: joi.boolean().optional().default(true),
                        nullable: joi.boolean().optional().default(true),
                    })
                ),
                fieldsSchema: joi
                    .array()
                    .items(joi.link('#publishedField'))
                    .required(),
                parquetSchema: joi.string().required(),
                arrowSchema: joi.string().required(),
                encodings: joi
                    .object()
                    .pattern(/^.+$/, joi.string().optional()),
            })
            .required(),
        data: joi
            .object()
            .pattern(
                /[A-Za-z_]{1}[A-Za-z0-9_-]+/,
                joi.array().items({
                    startTime: joi
                        .number()
                        .integer()
                        .allow(0)
                        .positive()
                        .required(),
                    endTime: joi.number().integer().positive().required(),
                    startBlock: joi.string().required(),
                    endBlock: joi.string().required(),
                    startId: joi
                        .number()
                        .integer()
                        .allow(0)
                        .positive()
                        .required(),
                    endId: joi
                        .number()
                        .integer()
                        .allow(0)
                        .positive()
                        .required(),
                    ipfsPath: joi.string().required(),
                    size: joi.number().integer().positive().required(),
                    createdAt: joi.number().integer().positive().required(),
                })
            )
            .required(),
        metadata: joi
            .object()
            .pattern(/[A-Za-z_]{1}[A-Za-z0-9_-]+/, joi.any())
            .required(),
    })
    .shared(publishedQueryableManifestSchemaEntityField)

async function readAndValidateManifest(
    program: Command,
    ipfsDaemonUrl: string,
    projectPath: string,
    verbosity: number,
    fetchAndValidateDataSources: boolean
): Promise<{
    manifest: Manifest
    dataSources: { [name: string]: PublishedDataSourceItem }
    entities: { [entityId: string]: PublishedDataSourceItemEntity }
    content: string
}> {
    const queryableYmlPath = path.join(projectPath, 'queryable.yaml')
    const queryableYamlPath = path.join(projectPath, 'queryable.yaml')

    let queryableManifestPath

    if (verbosity > 1) {
        console.log(colors.grey(`Checking if ${queryableYamlPath} exists`))
    }

    if (fs.existsSync(queryableYamlPath)) {
        queryableManifestPath = queryableYamlPath
    } else {
        if (verbosity > 1) {
            console.log(colors.grey(`Checking if ${queryableYmlPath} exists`))
        }

        if (fs.existsSync(queryableYmlPath)) {
            queryableManifestPath = queryableYmlPath
        } else {
            program.error('Queryable manifest is not found in provided path')
            return
        }
    }

    const content = fs.readFileSync(queryableManifestPath, 'utf8')

    if (verbosity > 1) {
        console.log(
            colors.grey(
                `Queryable manifest content at ${queryableManifestPath}`
            )
        )
        console.log(colors.cyan(content))
    }

    const manifestObject = yaml.parse(content)

    const result = queryableManifestSchema.validate(manifestObject)

    if (result.error) {
        const formattedExplanation = result.error.details
            .map((error, index) => {
                return `${index + 1}. ${error.context.message || error.message}`
            })
            .join('\n')

        program.error(
            `Queryable manifest at ${queryableManifestPath} contains invalid structure.\nErrors:\n${formattedExplanation}`
        )

        return
    }

    const manifest: Manifest = result.value

    for (const entity of manifest.entities) {
        const relationFields: Array<string> = []

        if (entity.relations) {
            for (const relation of entity.relations) {
                let field: string = relation.localFieldName

                if (!field) {
                    field = `${relation.entity}_relation`
                }

                relationFields.push(field)
            }
        }

        for (const field of entity.fields) {
            if (relationFields.includes(field.name)) {
                program.error(
                    `Entity '${entity.name}' relation and field name has same name '${field.name}'`
                )
            }

            if (field.name === '_id') {
                program.error(
                    `Entity '${entity.name}' has restricted field name '${field.name}'`
                )
            }
        }
    }

    const dataSourcesWithSource: {
        [name: string]: PublishedDataSourceItem
    } = {}

    const namedEntities: {
        [entityId: string]: PublishedDataSourceItemEntity
    } = {}

    if (fetchAndValidateDataSources) {
        for (const source of manifest.dataSources) {
            const dataSources: Array<PublishedDataSourceItem> = []

            const publishedDataSource = await validateDatasourceSource(
                program,
                ipfsDaemonUrl,
                source.ipfsPath,
                verbosity
            )

            dataSourcesWithSource[`${source.name}`] =
                publishedDataSource.dataSource

            for (const entityName of Object.keys(
                publishedDataSource.dataSource.entities
            )) {
                const entity =
                    publishedDataSource.dataSource.entities[entityName]

                const entityId = `${source.name}/${entityName}`

                if (!Object.hasOwnProperty.apply(namedEntities, [entityId])) {
                    namedEntities[entityId] = entity

                    for (const relation of entity.relations) {
                        relation.entity = `${source.name}/${relation.entity}`
                    }
                } else {
                    program.error(
                        `Datasource entity id already present, source name: ${source.name}, entity name: ${entityName}`
                    )
                }
            }

            dataSources.push(publishedDataSource.dataSource)
        }

        const localEntities: { [entityName: string]: ManifestEntity } = {}

        for (const entity of manifest.entities) {
            localEntities[entity.name] = entity
        }

        console.log(colors.green(`Checking relations`))

        for (const entity of manifest.entities) {
            if (entity.relations) {
                for (const relation of entity.relations) {
                    if (relation.dataSource) {
                        if (
                            !Object.hasOwnProperty.apply(namedEntities, [
                                `${relation.dataSource}/${relation.entity}`,
                            ])
                        ) {
                            program.error(
                                `Entity '${entity.name}' has unmet relation '${relation.entity}'`
                            )
                        } else {
                            relation.entity = `${relation.dataSource}/${relation.entity}`
                        }
                    } else if (
                        !Object.hasOwnProperty.apply(localEntities, [
                            relation.entity,
                        ])
                    ) {
                        program.error(
                            `Entity '${entity.name}' has unmet relation '${relation.entity}'`
                        )
                    }
                }
            }
        }

        console.log(colors.green(`Checking jobs`))

        for (const job of manifest.jobs) {
            for (const handler of job.handlers) {
                for (const dataSource of handler.dataSources) {
                    if (
                        !Object.hasOwnProperty.apply(dataSourcesWithSource, [
                            dataSource.name,
                        ])
                    ) {
                        program.error(
                            `Job '${job.name}' has unknown source '${dataSource}'`
                        )
                    }

                    if (
                        !Object.hasOwnProperty.apply(namedEntities, [
                            `${dataSource.name}/${dataSource.entity}`,
                        ])
                    ) {
                        program.error(
                            `Job '${job.name}' has unknown data source '${dataSource.name}' entity '${dataSource.entity}'`
                        )
                    }
                }

                if (handler.dataSources.length > 1) {
                    if (isNaN(job.timeWindow) || job.timeWindow === 0) {
                        program.error(
                            `Job '${job.name}' has undefined timeWindow meanwhile has multiple data sources.`
                        )
                    }
                }
            }
        }
    }

    return {
        manifest: manifest,
        dataSources: dataSourcesWithSource,
        entities: namedEntities,
        content,
    }
}

async function validateDatasourceSource(
    program: Command,
    ipfsDaemonUrl: string,
    ipfsPath: string,
    verbosity: number
): Promise<{ dataSource: PublishedDataSourceItem }> {
    let dataSourceManifestContent: string

    try {
        dataSourceManifestContent = await ipfs.getFileFromIpfs(
            ipfsDaemonUrl,
            ipfsPath
        )
    } catch (error) {
        program.error(`Failed to retrieve manifest from path ${ipfsPath}`)
    }

    if (verbosity > 1) {
        console.log(colors.grey(`Published Queryable manifest at ${ipfsPath}`))
        console.log(colors.cyan(dataSourceManifestContent))
    }

    const dataSourceManifest = JSON.parse(dataSourceManifestContent)

    const result = publishedQueryableManifestSchema.validate(dataSourceManifest)

    if (result.error) {
        const formattedExplanation = result.error.details
            .map((error, index) => {
                return `${index + 1}. ${error.context.message || error.message}`
            })
            .join('\n')

        program.error(
            `Queryable manifest at ${ipfsPath} contains invalid structure.\nErrors:\n${formattedExplanation}`
        )

        return
    }

    // @TODO: validate handler appliedFilter

    return {
        dataSource: result.value,
    }
}

function serializeAndSave(
    job: Manifest,
    queryableManifestPath: string,
    verbosity: number
) {
    const serializedJob = yaml.stringify(job)

    if (verbosity > 0) {
        console.log(
            colors.grey(`Writing Queryable manifest`),
            queryableManifestPath
        )
    }

    if (verbosity > 1) {
        console.log(colors.grey(`Queryable manifest content`))
        console.log(colors.cyan(serializedJob))
    }

    fs.writeFileSync(queryableManifestPath, serializedJob)
}

export default {
    readAndValidateManifest,
    serializeAndSave,
}
