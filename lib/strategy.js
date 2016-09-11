import jsen from 'jsen'
import inspectSchema from './inspectSchema'
import {defaultMessages, buildMessage} from './messages'

export default function strategy (mainOptions) {
  mainOptions = mainOptions || {}
  mainOptions = Object.assign(
    {
      greedy: true,
      additionalProperties: true,
      messages: Object.assign({}, defaultMessages, mainOptions.messages || {})
    },
    mainOptions
  )

  const jsenOptions = {
    greedy: mainOptions.greedy,
    additionalProperties: mainOptions.additionalProperties
  }

  const makeGetterKey = (key) => {
    return key.replace(/^\./, '').replace(/\[([0-9]+)\]/, '.$1')
  }

  const makePath = (key) => {
    return makeGetterKey(key).split('.')
  }

  const pathFinder = (path, data) => {
    let actual = data
    for (let key of makeGetterKey(path).split('.')) {
      actual = actual[key]
    }
    return actual
  }

  const schemaPathFinder = (schema, key, data) => {
    let lastKey = makePath(key).pop()
    let value = pathFinder(key, data)
    let result = value
    if (schema.type === 'array' && !isNaN(lastKey)) {
      result = [value]
    }
    return result
  }

  const getSchema = (schema, options = {}) => {
    const {key} = options
    if (!key) {
      return [jsen(schema, jsenOptions), data => data, schema]
    } else {
      const schemaKey = key.replace(/\[[0-9]+\]/g, '')
      const path = schemaKey.split('.')
      const pathSize = path.length
      const parentPath = path.slice(0, pathSize - 1)
      const parentKey = parentPath.join('.')
      const propertyName = path[pathSize - 1]
      const parentSchema = parentKey ? inspectSchema(schema, parentKey) : schema
      const required = parentSchema.required && parentSchema.required.indexOf(propertyName) >= 0 ? [propertyName] : []
      const fieldSchema = inspectSchema(schema, schemaKey)
      if (!fieldSchema) {
        return null
      }
      let partialSchema = {
        type: 'object',
        properties: {
          [propertyName]: fieldSchema
        }
      }
      if (required.length) {
        partialSchema.required = required
      }
      return [
        jsen(partialSchema, jsenOptions),
        (data) => ({
          [propertyName]: schemaPathFinder(fieldSchema, key, data)
        }),
        partialSchema
      ]
    }
  }

  const parseError = (error, parentKey, schema) => {
    let key = error.path
    let innerPath = key.replace(/^\./, '').replace(/\[([0-9]+)\]/, '.$1').split('.')
    let parentPath = []
    let parentPathLastKey
    if (parentKey) {
      parentPath = makePath(parentKey)
      parentPathLastKey = parentPath.pop() // intentionally remove
      if (!isNaN(parentPathLastKey)) {
        innerPath[1] = parentPathLastKey
        parentPath.pop()
      }
    }
    return {
      path: key ? parentPath.concat(innerPath) : parentPath,
      message: buildMessage(error, mainOptions.messages, schema)
    }
  }

  const ensureParentKey = (obj, parentKey) => {
    if (!parentKey) return obj
    let context = obj
    let path = makePath(parentKey)
    let key
    for (let i = 0, c = path.length; i < c; i++) {
      key = path[i]
      if (!context[key]) {
        context[key] = i < c - 1 ? {} : undefined
        context = context[key]
      }
    }
    return obj
  }

  const parseErrors = (errors, parentKey, schema) => {
    let results = ensureParentKey({}, parentKey)
    let result, step, context
    for (let error of errors) {
      result = parseError(error, parentKey, schema)
      context = results
      for (let i = 0, c = result.path.length; i < c; i++) {
        step = result.path[i]
        if (!results[step]) {
          context[step] = i < c - 1 ? {} : []
        }
        if (i === c - 1) {
          context[step].push(result.message)
        }
        context = context[step]
      }
    }
    return results
  }

  return {
    validate: (data = {}, rootSchema = {}, options = {}, callback) => {
      const {key} = options
      const results = getSchema(rootSchema, options)
      const errors = ensureParentKey({}, key)
      if (!results) {
        callback(errors)
        return
      }
      const [validate, transformer, schema] = results
      const valid = validate(transformer(data))
      if (valid) {
        callback(errors)
      } else {
        callback(parseErrors(validate.errors, key, schema))
      }
    }
  }
}

