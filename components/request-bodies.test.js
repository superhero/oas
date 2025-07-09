import assert           from 'node:assert'
import { suite, test }  from 'node:test'
import RequestBodies    from '@superhero/oas/components/request-bodies'

suite('@superhero/oas/request-bodies', () =>
{
  const specification = {
    components: {
      requestBodies: {
        CreateUser: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
        }
      },
      responses: {
        UserCreated: {
          description: 'User created successfully.'
        },
        BadRequest: {
          description: 'Invalid input.'
        }
      },
      schemas: {
        'User': {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' } }
        }
      }
    },
    paths: {
      '/users': {
        post: {
          requestBody: { $ref: '#/components/requestBodies/CreateUser' },
          responses: {
            '201': { $ref: '#/components/responses/UserCreated' },
            '400': { $ref: '#/components/responses/BadRequest' }
          }
        }
      }
    }
  }

  const requestBodies = new RequestBodies(specification)

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
        code: 'E_OAS_INVALID_REQUEST_BODIES_SPECIFICATION'
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
        code: 'E_OAS_UNSUPORTED_REQUEST_BODIES_SPECIFICATION'
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
        code: 'E_OAS_UNSUPORTED_REQUEST_BODIES_SPECIFICATION'
      })
    })

    test('allows $ref only without content', () =>
    {
      const component = { $ref: '#/components/requestBodies/CreateUser' }

      assert.doesNotThrow(() => requestBodies.validateComponent(component))
    })
  })
})
