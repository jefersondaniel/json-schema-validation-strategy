import Ajv from 'ajv'
import SchemaInspector from 'ajv-inspector'

export default function strategy (mainOptions) {
  if (typeof mainOptions === 'function') {
    mainOptions = mainOptions()
  }

  let ajv = new Ajv(Object.assign({allErrors: true}, mainOptions))

  let makeGetterKey = (key) => {
    return key.replace(/^\./, '').replace(/\[([0-9]+)\]/, '.$1')
  }

  let makePath = (key) => {
    return makeGetterKey(key).split('.')
  }

  let pathFinder = (path, data) => {
    let actual = data
    for (let key of makeGetterKey(path).split('.')) {
      actual = actual[key]
    }
    return actual
  }

  let schemaPathFinder = (schema, key, data) => {
    let lastKey = makePath(key).pop()
    let value = pathFinder(key, data)
    let result = value
    if (schema.type === 'array' && !isNaN(lastKey)) {
      result = [value]
    }
    return result
  }

  let getSchema = (schema, options = {}) => {
    const {key} = options
    if (!key) {
      return Promise.resolve([ajv.compile(schema), data => data])
    } else {
      const inspector = new SchemaInspector(schema, {loadSchema: SchemaInspector.httpSchemaLoader})
      return inspector
        .compile()
        .then(
          () => {
            let schemaKey = key.replace(/\[[0-9]+\]/g, '')
            let path = schemaKey.split('.')
            let pathSize = path.length
            let parentPath = path.slice(0, pathSize - 1)
            let parentKey = parentPath.join('.')
            let propertyName = path[pathSize - 1]
            let parentSchema = parentKey ? inspector.inspect(parentKey) : schema
            let required = parentSchema.required && parentSchema.required.indexOf(propertyName) >= 0 ? [propertyName] : []
            let fieldSchema
            try {
              fieldSchema = inspector.inspect(schemaKey)
            } catch (err) {
              return null
            }
            let partialSchema = {
              '$async': true,
              type: 'object',
              properties: {
                [propertyName]: fieldSchema
              }
            }
            if (required.length) {
              partialSchema.required = required
            }
            return [
              ajv.compile(partialSchema),
              (data) => ({
                [propertyName]: schemaPathFinder(fieldSchema, key, data)
              })
            ]
          }
        )
    }
  }

  let parseError = (error, parentKey) => {
    let key = error.dataPath + (error.params.missingProperty ? '.' + error.params.missingProperty : '')
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
      message: error.message
    }
  }

  let ensureParentKey = (obj, parentKey) => {
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

  let parseErrors = (errors, parentKey) => {
    let results = ensureParentKey({}, parentKey)
    let result, step, context
    for (let error of errors) {
      result = parseError(error, parentKey)
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
    validate: (data = {}, rawSchema = {}, options = {}, callback) => {
      const schema = Object.assign({}, rawSchema, {$async: true})
      const {key} = options
      getSchema(schema, options).then(
        (results) => {
          var errors = ensureParentKey({}, key)
          if (!results) {
            callback(errors)
            return
          }
          let [validate, transformer] = results
          validate(transformer(data))
            .then(
              (valid) => {
                callback(errors)
              },
              (validation) => {
                if (!(validation instanceof Ajv.ValidationError)) throw validation
                callback(parseErrors(validation.errors, key))
              }
            )
        },
        (errors) => {
          throw errors
        }
      )
    }
  }
}

