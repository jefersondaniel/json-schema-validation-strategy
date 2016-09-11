import inspectSchema from './inspectSchema'

export const defaultMessages = {
  'type': '"{{key}}" must be a {{schema.type}}',
  'enum': '"{{key}}" must be one of: {{schema.enum}}',
  'minimum': '"{{key}}" must be less than or equal to {{schema.minimum}}',
  'exclusiveMinimum': '"{{key}}" must be less than {{schema.exclusiveMinimum}}',
  'maximum': '"{{key}}" must be larger than or equal to {{schema.maximum}}',
  'exclusiveMaximum': '"{{key}}" must be larger than or equal to {{schema.exclusiveMaximum}}',
  'multipleOf': '"{{key}}" must be multiple of {{schema.multipleOf}}',
  'minLength': '"{{key}}" length must be at least {{minLength}} characters long',
  'maxLength': '"{{key}}" length must be less than or equal to {{maxLength}} characters long',
  'pattern': '"{{key}}" should match pattern "{{schema.pattern}}"',
  'format': '"{{key}}" should match format "{{schema.format}}"',
  'minItems': '"{{key}}" must contain at least {{minItems}} items',
  'maxItems': '"{{key}}" must contain less than or equal to {{maxItems}} items',
  'additionalItems': '"{{key}}" is invalid',
  'uniqueItems': '"{{key}}" must contain unique items',
  'items': '"{{key}}" is invalid',
  'minProperties': '"{{key}}" must contain at least {{minProperties}} properties',
  'maxProperties': '"{{key}}" must contain less than or equal to {{maxProperties}} items',
  'required': '"{{key}}" is required',
  'properties': '"{{key}}" is invalid',
  'patternProperties': '"{{key}}" properties should match pattern "{{schema.patternProperties}}"',
  'additionalProperties': '"{{key}}" is invalid',
  'dependencies': '"{{key}}" is invalid',
  'allOf': '"{{key}}" is invalid',
  'anyOf': '"{{key}}" is invalid',
  'oneOf': '"{{key}}" is invalid',
  'not': '"{{key}}" is invalid',
  '$ref': '"{{key}}" is invalid'
}

function compileMessage (error, template, prefix = '') {
  if (typeof template === 'function') {
    return template(error)
  }
  let result = template
  for (let key in error) {
    if (typeof error[key] === 'object') {
      result = compileMessage(error[key], result, key)
    } else {
      result = result.replace(
        new RegExp('{{' + (prefix ? prefix + '.' + key : key) + '}}', 'g'),
        error[key]
      )
    }
  }
  return result
}

export function buildMessage (rawError, messages, schema) {
  let propertySchema = inspectSchema(schema, rawError.path)
  if (propertySchema.type === 'array' && /\.[0-9]+$/.test(rawError.path)) {
    propertySchema = propertySchema.items
  }
  const error = Object.assign(
    rawError,
    {
      schema: propertySchema,
      key: propertySchema && propertySchema.label
        ? propertySchema.label
        : rawError.path.split('.').pop()
    }
  )
  let template = messages[error.keyword]
  if (error.message) {
    template = error.message
  }
  return compileMessage(error, template)
}

