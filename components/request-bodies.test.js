import assert           from 'node:assert'
import { suite, test }  from 'node:test'
import RequestBodies    from '@superhero/oas/components/request-bodies'
import config           from '../config.json' with { type: 'json' }

suite('@superhero/oas/request-bodies', () =>
{
  const requestBodies = new RequestBodies(config.oas)

  suite('conform', () =>
  {
    test('conforms valid application/json request body', () =>
    {
      const component =
      {
        content:
        {
          'application/json':
          {
            schema:
            {
              type       : 'object',
              properties : { foo: { type: 'string' } }
            }
          }
        }
      }

      const request = 
      {
        headers : { 'content-type': 'application/json' },
        body    : { foo: 'bar' }
      }

      const conformed = requestBodies.conform(component, request)
      assert.deepStrictEqual(conformed, { foo: 'bar' })
      assert.deepStrictEqual(request.body, { foo: 'bar' })
    })

    test('throws if content-type does not match', () =>
    {
      const component =
      {
        content:
        {
          'application/json': { schema: { type: 'object' }}
        }
      }

      const request = 
      {
        headers : { 'content-type': 'text/plain' },
        body    : 'foobar'
      }

      assert.throws(() => requestBodies.conform(component, request), { code: 'E_OAS_INVALID_REQUEST_BODY' })
    })

    test('supports wildcard content type', () =>
    {
      const component =
      {
        content:
        {
          'application/*': { schema: { type: 'string' } }
        }
      }

      const request = 
      {
        headers : { 'content-type': 'application/json' },
        body    : 'foobar'
      }

      const conformed = requestBodies.conform(component, request)
      assert.strictEqual(conformed, 'foobar')
    })

    test('throws if matching content-type lacks schema', () =>
    {
      const component =
      {
        content:
        {
          'application/json': {}
        }
      }

      const request = 
      {
        headers : { 'content-type': 'application/json' },
        body    : {}
      }

      assert.throws(() => requestBodies.conform(component, request), 
      { code: 'E_OAS_INVALID_REQUEST_BODY' })
    })

    test('throws on invalid $ref', () =>
    {
      const component = { $ref: '#/components/invalid/' }
      const request = { headers: { 'content-type': 'application/json' }, body: {} }

      assert.throws(() => requestBodies.conform(component, request), { code: 'E_OAS_INVALID_REQUEST_BODY' })
    })
  })

  suite('validateComponent', () =>
  {
    test('valid component with application/json', () =>
    {
      const component =
      {
        content:
        {
          'application/json': { schema: { type: 'object' }}
        }
      }

      assert.doesNotThrow(() => requestBodies.validateComponent(component))
    })

    test('throws if content is not an object', () =>
    {
      const component = { content: 'invalid' }

      assert.throws(() => requestBodies.validateComponent(component), {
        code: 'E_OAS_INVALID_SPECIFICATION'
      })
    })

    test('throws if application/json is missing', () =>
    {
      const component =
      {
        content:
        {
          'text/plain': { schema: { type: 'string' }}
        }
      }

      assert.throws(() => requestBodies.validateComponent(component), {
        code: 'E_OAS_UNSUPORTED_SPECIFICATION'
      })
    })

    test('throws if multiple content types defined', () =>
    {
      const component =
      {
        content:
        {
          'application/json': { schema: { type: 'object' }},
          'text/plain': { schema: { type: 'string' }}
        }
      }

      assert.throws(() => requestBodies.validateComponent(component), {
        code: 'E_OAS_UNSUPORTED_SPECIFICATION'
      })
    })

    test('allows $ref only without content', () =>
    {
      const component = { $ref: '#/components/requestBodies/foo' }

      assert.doesNotThrow(() => requestBodies.validateComponent(component))
    })
  })
})
