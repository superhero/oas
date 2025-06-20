import assert           from 'node:assert'
import { suite, test }  from 'node:test'
import Parameters       from '@superhero/oas/components/parameters'
import config           from '../config.json' with { type: 'json' }

suite('@superhero/oas/parameters', () =>
{
  const parameters = new Parameters(config.oas)

  suite('conform', () =>
  {
    test('conforms a required query parameter with schema', () =>
    {
      const component = { name: 'foo', in: 'query', required: true, schema: { type: 'integer' } }
      const request = { url: new URL('http://localhost/?foo=123'), param: {}, headers: {} }
      const result = parameters.conform(component, request)
      assert.strictEqual(result, 123)
      assert.strictEqual(request.param.foo, 123)
    })

    test('uses default if missing and defined', () =>
    {
      const component = { name: 'foo', in: 'query', schema: { type: 'string', default: 'bar' } }
      const request = { url: new URL('http://localhost/'), param: {}, headers: {} }
      const result = parameters.conform(component, request)
      assert.strictEqual(result, 'bar')
      assert.strictEqual(request.param.foo, 'bar')
    })

    test('throws if required and missing', () =>
    {
      const component = { name: 'foo', in: 'query', required: true }
      const request = { url: new URL('http://localhost/'), param: {}, headers: {} }
      assert.throws(() => parameters.conform(component, request), { code: 'E_OAS_INVALID_PARAMETER' })
    })

    test('allows null if nullable', () =>
    {
      const component = { name: 'foo', in: 'query', schema: { type: 'string' }, nullable: true }
      const request = { url: new URL('http://localhost/?foo=null'), param: {}, headers: {} }
      const result = parameters.conform(component, request)
      assert.strictEqual(result, null)
    })

    test('extracts from path and explodes', () =>
    {
      const component = { name: 'ids', in: 'path', explode: true }
      const request = { url: new URL('http://localhost/'), param: { ids: '1,2,3' }, headers: {} }
      const result = parameters.conform(component, request)
      assert.deepStrictEqual(result, ['1', '2', '3'])
    })

    test('extracts from header without explode', () =>
    {
      const component = { name: 'x-token', in: 'header' }
      const request = { url: new URL('http://localhost/'), param: {}, headers: { 'x-token': 'abc123' } }
      const result = parameters.conform(component, request)
      assert.strictEqual(result, 'abc123')
    })

    test('extracts multiple from query with explode', () =>
    {
      const component = { name: 'id', in: 'query', explode: true }
      const request = { url: new URL('http://localhost/?id=1&id=2'), param: {}, headers: {} }
      const result = parameters.conform(component, request)
      assert.deepStrictEqual(result, ['1', '2'])
    })

    test('returns undefined if not required and not present', () =>
    {
      const component = { name: 'foo', in: 'query' }
      const request = { url: new URL('http://localhost/'), param: {}, headers: {} }
      const result = parameters.conform(component, request)
      assert.strictEqual(result, undefined)
    })

    test('throws on unsupported allowReserved', () =>
    {
      const component = { name: 'foo', in: 'query', allowReserved: true }
      assert.throws(() => parameters.validateParameterComponent(component), { code: 'E_OAS_UNSUPORTED_SPECIFICATION' })
    })

    test('throws on unsupported style', () =>
    {
      const component = { name: 'foo', in: 'query', style: 'form' }
      assert.throws(() => parameters.validateParameterComponent(component), { code: 'E_OAS_UNSUPORTED_SPECIFICATION' })
    })

    test('throws on invalid $ref target', () =>
    {
      const component = { $ref: '#/components/invalid' }
      const request = { url: new URL('http://localhost/'), param: {}, headers: {} }
      assert.throws(() => parameters.conform(component, request), { code: 'E_OAS_INVALID_PARAMETER' })
    })
  })

  suite('validateComponent', () =>
  {
    test('throws if not array', () =>
    {
      assert.throws(() => parameters.validateComponent({}), { code: 'E_OAS_INVALID_SPECIFICATION' })
    })

    test('validates an array of parameter objects', () =>
    {
      const input = [ { name: 'foo', in: 'query' }, { name: 'bar', in: 'path', required: true } ]
      assert.doesNotThrow(() => parameters.validateComponent(input))
    })

    test('throws if parameter is not object', () =>
    {
      const input = [ 42 ]
      assert.throws(() => parameters.validateComponent(input), { code: 'E_OAS_INVALID_SPECIFICATION' })
    })

    test('throws if name is missing', () =>
    {
      const input = [ { in: 'query' } ]
      assert.throws(() => parameters.validateComponent(input), { code: 'E_OAS_INVALID_SPECIFICATION' })
    })

    test('throws if in is missing', () =>
    {
      const input = [ { name: 'foo' } ]
      assert.throws(() => parameters.validateComponent(input), { code: 'E_OAS_INVALID_SPECIFICATION' })
    })

    test('throws if in is invalid', () =>
    {
      const input = [ { name: 'foo', in: 'cookie' } ]
      assert.throws(() => parameters.validateComponent(input), { code: 'E_OAS_INVALID_SPECIFICATION' })
    })
  })
})
