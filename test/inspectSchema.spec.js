/* global describe, it */
import {expect} from 'chai'
import inspectSchema from '../lib/inspectSchema'

describe('inspectSchema', () => {
  it('ensure exports function', () => {
    expect(typeof inspectSchema === 'function').to.equal(true)
  })

  it('should inspect basic key', () => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {type: 'string'}
      }
    }
    const result = inspectSchema(schema, 'firstName')
    expect(result).to.deep.equal({type: 'string'})
  })

  it('should inspect deep array key', () => {
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
    const result = inspectSchema(schema, 'objects.b')
    expect(result).to.deep.equal({type: 'number'})
  })
})
