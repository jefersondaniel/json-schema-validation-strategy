/* global describe, it */
import {expect} from 'chai'
import strategy from '../lib/strategy'

describe('messages', () => {
  it('should enable custom messages', (done) => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {type: 'string'}
      }
    }
    const options = {
      messages: {
        required: '{{key}} custom required message.'
      }
    }
    strategy(options).validate({}, schema, {}, errors => {
      expect(errors['firstName']).to.deep.equal(['firstName custom required message.'])
      done()
    })
  })

  it('should enable custom property messages', (done) => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {
          type: 'string',
          requiredMessage: 'i am required.'
        }
      }
    }
    strategy().validate({}, schema, {}, errors => {
      expect(errors['firstName']).to.deep.equal(['i am required.'])
      done()
    })
  })

  it('should enable custom field names', (done) => {
    const schema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: {
          type: 'string',
          label: 'First name'
        }
      }
    }
    strategy().validate({}, schema, {}, errors => {
      expect(errors['firstName']).to.deep.equal(['"First name" is required'])
      done()
    })
  })
})
