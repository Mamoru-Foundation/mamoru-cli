import joi from 'joi'

export function formatJoiError(error: joi.ValidationError): string {
    const formattedExplanation = error.details
        .map((error, index) => {
            return `${index + 1}. ${error.context.message || error.message}`
        })
        .join('\n')

    return `manifest contains invalid structure.\nErrors:\n${formattedExplanation}`
}
