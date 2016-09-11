function followPath (schema, step) {
  if (schema.type === 'object') {
    return schema.properties[step]
  } else if (schema.type === 'array') {
    return followPath(schema.items || {}, step)
  }
}

export default function (schema, key) {
  const path = key.replace(/\.[0-9]+\./, '.').replace(/\.[0-9]+$/, '').split('.')
  let context = schema
  for (let step of path) {
    context = followPath(context, step)
    if (!context) {
      break
    }
  }
  return context
}
