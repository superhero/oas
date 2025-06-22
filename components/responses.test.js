import assert           from 'node:assert'
import { suite, test }  from 'node:test'
import Responses        from '@superhero/oas/components/responses'
import config           from '../config.json' with { type: 'json' }

suite('@superhero/oas/responses', () =>
{
  const responses = new Responses(config.oas)

  suite('conform', () =>
  {
    test('sets response body and content-type header from schema', () =>
    {
      const component =
      {
        content:
        {
          'application/json':
          {
            schema:
            {
              type      : 'object',
              properties: { foo: { type: 'string' } }
            }
          }
        }
      }

      const view = 
      {
        headers : {},
        body    : { foo: 'bar' }
      }

      const result = responses.conform(component, view)
      assert.strictEqual(result.headers['content-type'], 'application/json')
      assert.deepStrictEqual(result.body, { foo: 'bar' })
    })

    test('throws if unsupported content type in content', () =>
    {
      const component = { content: { 'text/plain': {} } }
      const view      =
      {
        headers : {},
        body    : 'hello'
      }

      assert.throws(() => responses.conform(component, view), 
      { code: 'E_OAS_INVALID_RESPONSE' })
    })

    test('does not fail if content has no schema', () =>
    {
      const component = { content: { 'application/json': {} } }
      const view      =
      {
        headers : {},
        body    : { foo: 'bar' }
      }

      const result = responses.conform(component, view)
      assert.strictEqual(result.headers['content-type'], 'application/json')
      assert.strictEqual(result.body, view.body)
    })

    test('sets response headers using header schema', () =>
    {
      const component = { headers: { 'X-Foo': { schema: { type: 'integer' } } } }
      const view      = 
      {
        headers : { 'X-Foo': '123' },
        body    : {}
      }

      const result = responses.conform(component, view)
      assert.strictEqual(result.headers['X-Foo'], 123)
    })

    test('throws on invalid header schema', () =>
    {
      const component = { headers: { 'X-Foo': { schema: { type: 'integer' } } } }
      const view      =
      {
        headers : { 'X-Foo': 'not-a-number' },
        body    : {}
      }

      assert.throws(() => responses.conform(component, view), 
      { code: 'E_OAS_INVALID_RESPONSE' })
    })

    test('throws if headers is not an object', () =>
    {
      const component = { headers : 'invalid' }
      const view      = { headers : {}, body : {} }

      assert.throws(() => responses.conform(component, view), 
      { code: 'E_OAS_INVALID_RESPONSE' })
    })

    test('passes through if component is a $ref', () =>
    {
      const component = { $ref: '#/components/responses/foo' }
      const view      = { headers: {}, body: {} }

      assert.throws(() => responses.conform(component, view), 
      { code: 'E_OAS_INVALID_RESPONSE' })
    })
  })

  suite('validateRefPointer', () =>
  {
    test('accepts valid pointer', () =>
    {
      assert.doesNotThrow(() => responses.validateRefPointer('/components/responses/foo'))
    })

    test('throws on invalid pointer', () =>
    {
      assert.throws(() => responses.validateRefPointer('/components/invalid/foo'), 
      { code: 'E_OAS_INVALID_SPECIFICATION' })
    })
  })

  suite('validateComponentAttributes', () =>
  {
    test('does not throw if an empty response object', () =>
    {
      assert.doesNotThrow(() => responses.validateComponentAttributes({}), 
      { code: 'E_OAS_INVALID_SPECIFICATION' })
    })

    test('throws if status code is invalid', () =>
    {
      assert.throws(() => responses.validateComponentAttributes({ '2000': {} }), 
      { code: 'E_OAS_INVALID_SPECIFICATION' })
    })
  })
})
