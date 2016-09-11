# json-schema-validation-strategy

[![Build Status](https://secure.travis-ci.org/jefersondaniel/json-schema-validation-strategy.png?branch=master)](http://travis-ci.org/jefersondaniel/json-schema-validation-strategy)
[![npm version](https://badge.fury.io/js/json-schema-validation-strategy.svg)](https://badge.fury.io/js/json-schema-validation-strategy)

JSON Schema validation strategy for [react-validation-mixin](https://github.com/jurassix/react-validation-mixin).

This library provides a validation strategy based on the library [jsen](https://github.com/bugventure/jsen)

# Custom messages and i18n

### Property name override

```javascript
validatorTypes:  {
  type: 'object',
  required: ['username'],
  properties: {
    username: {
      type: 'string',
      label: 'Field name'
    }
  }
}
```

### Message override

```javascript
validatorTypes:  {
  type: 'object',
  required: ['username'],
  properties: {
    username: {
      type: 'string',
      minLength: 5,
      invalidMessage: 'Invalid username',
      requiredMessage: 'Username is required'
    }
  }
}
```

### Global message override

```javascript
const options = {
  messages: {
    required: '{{key}} custom required message.'
  }
}

export default validation(strategy(options))(component);
```
