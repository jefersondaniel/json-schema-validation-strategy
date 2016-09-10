/* global describe, it */
import {expect} from 'chai'
import strategy from '../lib/strategy'

describe('AjvValidationStrategy', () => {
  it('ensure exports function', () => {
    expect(typeof strategy === 'function').to.equal(true)
  })

  it('should validate basic schema and data', (done) => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {type: 'string'}
      }
    }
    const data = {firstName: 'foo'}
    strategy().validate(data, schema, {}, errors => {
      expect(errors).to.be.empty
      done()
    })
  })

  it('should validate basic schema and data for key', (done) => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {type: 'string'}
      }
    }
    const data = {firstName: 'foo'}
    strategy().validate(data, schema, {key: 'firstName'}, errors => {
      expect(errors['firstName']).to.be.empty
      done()
    })
  })

  it('should produce error for basic schema and data', (done) => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {type: 'string'}
      }
    }
    strategy().validate({}, schema, {}, errors => {
      expect(errors).to.have.keys(['firstName'])
      expect(errors['firstName']).to.deep.equal(['should have required property \'firstName\''])
      done()
    })
  })

  it('should produce error for basic schema and data for key', (done) => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {type: 'string'}
      }
    }
    strategy().validate({}, schema, {key: 'firstName'}, errors => {
      expect(errors).to.have.keys(['firstName'])
      expect(errors['firstName']).to.deep.equal(['should have required property \'firstName\''])
      done()
    })
  })

  it('should validate nested schema and data', (done) => {
    const schema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          required: ['b'],
          properties: {
            b: {type: 'string'}
          }
        }
      }
    }
    const data = {a: {b: 'foo'}}
    strategy().validate(data, schema, {}, errors => {
      expect(errors).to.be.empty
      done()
    })
  })

  it('should validate nested schema and data for deep key', (done) => {
    const schema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          required: ['b'],
          properties: {
            b: {type: 'string'}
          }
        }
      }
    }
    const data = {a: {b: 'foo'}}
    strategy().validate(data, schema, {key: 'a.b'}, errors => {
      expect(errors['a']['b']).to.be.empty
      done()
    })
  })

  it('should fail validation for nested schema and data', (done) => {
    const schema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          required: ['b'],
          properties: {
            b: {type: 'string'}
          }
        }
      }
    }
    const data = {a: {}}
    strategy().validate(data, schema, {}, errors => {
      expect(errors).to.have.keys(['a'])
      expect(errors['a']).to.have.keys(['b'])
      expect(errors['a']['b']).to.deep.equal(['should have required property \'b\''])
      done()
    })
  })

  it('should fail validation for nested schema and data for deep key', (done) => {
    const schema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          required: ['b'],
          properties: {
            b: {type: 'string'}
          }
        }
      }
    }
    const data = {a: {}}
    strategy().validate(data, schema, {key: 'a.b'}, errors => {
      expect(errors).to.have.keys(['a'])
      expect(errors['a']).to.have.keys(['b'])
      expect(errors['a']['b']).to.deep.equal(['should have required property \'b\''])
      done()
    })
  })

  it('should validate nested schema and data for missing deep key', (done) => {
    const schema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          required: ['b'],
          properties: {
            b: {type: 'string'}
          }
        }
      }
    }
    const data = {a: {}}
    strategy().validate(data, schema, {key: 'a.b.c'}, errors => {
      expect(errors).to.deep.equal({a: {b: {c: undefined}}})
      done()
    })
  })

  it('should fail validation for nested schema and data for intermediate key and its children', (done) => {
    const schema = {
      type: 'object',
      required: ['d'],
      properties: {
        a: {
          type: 'object',
          required: ['b', 'c'],
          properties: {
            b: {type: 'string'},
            c: {type: 'string'}
          }
        },
        d: {type: 'string'}
      }
    }
    const data = {a: {}}
    strategy().validate(data, schema, {key: 'a'}, errors => {
      expect(errors).to.deep.equal({a: {b: ['should have required property \'b\''], c: ['should have required property \'c\'']}})
      done()
    })
  })

  it('should validate arrays in schema and data', (done) => {
    const schema = {
      type: 'object',
      properties: {
        range: {
          type: 'array',
          items: {
            type: 'number',
            minimum: 0,
            maximum: 10
          }
        },
        password: {
          type: 'string',
          pattern: '[a-zA-Z0-9]{3,30}'
        }
      }
    }
    strategy().validate({range: [0], password: '123'}, schema, {}, errors => {
      expect(errors).to.be.empty
      done()
    })
  })

  it('should validate arrays in schema and data for key', (done) => {
    const schema = {
      type: 'object',
      properties: {
        range: {
          type: 'array',
          items: {
            type: 'number',
            minimum: 0,
            maximum: 10
          }
        },
        password: {
          type: 'string',
          pattern: '[a-zA-Z0-9]{3,30}'
        }
      }
    }
    strategy().validate({range: [0], password: '123'}, schema, {key: 'range'}, errors => {
      expect(errors['range']).to.be.empty
      done()
    })
  })

  it('should produce errors for arrays in schema and data', (done) => {
    const schema = {
      type: 'object',
      properties: {
        range: {
          type: 'array',
          items: {
            type: 'number',
            minimum: 0,
            maximum: 10
          }
        },
        password: {
          type: 'string',
          pattern: '[a-zA-Z0-9]{3,30}'
        }
      }
    }
    strategy().validate({range: [100, 200], password: ''}, schema, {}, errors => {
      expect(errors).to.have.keys(['range', 'password'])
      expect(errors['password']).to.deep.equal([
        'should match pattern "[a-zA-Z0-9]{3,30}"'
      ])
      expect(errors['range'][0]).to.deep.equal(['should be <= 10'])
      expect(errors['range'][1]).to.deep.equal(['should be <= 10'])
      done()
    })
  })

  it('should produce errors for arrays in schema and data for key', (done) => {
    const schema = {
      type: 'object',
      properties: {
        range: {
          type: 'array',
          items: {
            type: 'number',
            minimum: 0,
            maximum: 10
          }
        },
        password: {
          type: 'string',
          pattern: '[a-zA-Z0-9]{3,30}'
        }
      }
    }
    strategy().validate({range: [100, 200], password: ''}, schema, {key: 'password'}, errors => {
      expect(errors).to.have.keys(['password'])
      expect(errors['password']).to.deep.equal([
        'should match pattern "[a-zA-Z0-9]{3,30}"'
      ])
      expect(errors['range']).to.be.undefined
      done()
    })
  })

  it('should validate object arrays in schema and data', (done) => {
    const schema = {
      type: 'object',
      properties: {
        objects: {
          type: 'array',
          items: {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: {type: 'string'},
              b: {type: 'number'}
            }
          }
        }
      }
    }
    const value = {objects: [{a: 'a', b: 1}, {a: 'a'}]}
    strategy().validate(value, schema, {}, errors => {
      expect(errors).to.have.keys(['objects'])
      expect(errors['objects'][0]).to.equal(undefined)
      expect(errors['objects'][1]).to.deep.equal({b: ['should have required property \'b\'']})
      done()
    })
  })

  it('should validate object arrays in schema and data for key', (done) => {
    const schema = {
      type: 'object',
      properties: {
        objects: {
          type: 'array',
          items: {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: {type: 'string'},
              b: {type: 'number'}
            }
          }
        }
      }
    }
    const value = {objects: [{}, {a: 'a'}]}
    strategy().validate(value, schema, {key: 'objects[1]'}, errors => {
      expect(errors).to.have.keys(['objects'])
      expect(errors['objects'][0]).to.equal(undefined)
      expect(errors['objects'][1]).to.deep.equal({b: ['should have required property \'b\'']})
      done()
    })
  })

  it('should validate nested objects', (done) => {
    const schema = {
      type: 'object',
      properties: {
        objects: {
          type: 'array',
          items: {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: {type: 'string'},
              b: {type: 'number'}
            }
          }
        },
        form: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30
            },
            email: {
              type: 'string'
            },
            password: {
              type: 'string',
              minLength: 6,
              maxLength: 30
            }
          }
        }
      }
    }
    strategy().validate({objects: [{}, {a: 'a'}], form: {username: null}}, schema, {}, errors => {
      expect(errors).to.have.keys(['objects', 'form'])
      expect(errors['objects'][1]).to.deep.equal({b: ['should have required property \'b\'']})
      expect(errors['form'].username[0]).to.equal('should be string')
      done()
    })
  })
})

