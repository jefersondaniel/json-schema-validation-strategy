import Ajv from 'ajv'
import SchemaInspector from 'ajv-inspector'

export default function strategy (mainOptions) {
  if (typeof mainOptions === 'function') {
    mainOptions = mainOptions()
  }

  let ajv = new Ajv(Object.assign({allErrors: true}, mainOptions))

  let pathFinder = (path, data) => {
    let actual = data
    for (let key of path.split('.')) {
      actual = actual[key]
    }
    return actual
  }

  let getSchema = (schema, options = {}) => {
    const {key} = options
    if (! key) {
      return Promise.resolve([ajv.compile(schema), data => data, null])
    } else {
      const inspector = new SchemaInspector(schema, {loadSchema: SchemaInspector.httpSchemaLoader})
      return inspector
        .compile()
        .then(
          () => {
            let path = key.replace(/\[[0-9]+\]/g, '').split('.')
            let pathSize = path.length
            let parentPath = path.slice(0, pathSize - 1)
            let parentKey = parentPath.join('.')
            let propertyName = path[pathSize - 1]
            let parentSchema = parentKey ? inspector.inspect(parentKey) : schema
            let required = parentSchema.required && parentSchema.required.indexOf(propertyName) >= 0 ? [propertyName] : []
            let partialSchema = {
              '$async': true,
              type: 'object',
              properties: {
                [propertyName]: inspector.inspect(key)
              }
            }
            if (required.length) {
              partialSchema.required = required
            }
            return [
              ajv.compile(partialSchema),
              (data) => ({
                [propertyName]: pathFinder(key, data)
              }),
              key
            ]
          }
        )
    }
  }

  let makePath = (key) => {
    return key.replace(/^\./, '').replace(/\[([0-9]+)\]/, '.$1').split('.')
  }

  let parseError = (error, parentKey) => {
    let key = error.dataPath + (error.params.missingProperty ? '.' + error.params.missingProperty : '')
    let innerPath = key.replace(/^\./, '').replace(/\[([0-9]+)\]/, '.$1').split('.')
    let parentPath = [], parentPathSize = 0
    if (parentKey) {
      parentPath = makePath(parentKey)
      parentPathSize = parentPath.length
      parentPath = parentPath.slice(0, parentPathSize - 1)
    }
    return {
      path: key ? parentPath.concat(innerPath) : parentPath,
      message: error.message
    }
  }

  let parseErrors = (errors, parentKey) => {
    let results = {}, result, step, context
    for (let error of errors) {
      result = parseError(error, parentKey)
      context = results
      for (let i = 0, c = result.path.length; i < c; i++) {
        step = result.path[i]
        if (! results[step]) {
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
      getSchema(schema, options).then(
        (results) => {
          let [validate, transformer, baseKey] = results

          validate(transformer(data))
            .then(
              (valid) => {
                callback([])
              },
              (errors) => {
                if (!(errors instanceof Ajv.ValidationError)) throw errors;
                callback(parseErrors(errors.errors, baseKey))
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

