import assert           from 'node:assert'
import { suite, test }  from 'node:test'
import Headers          from '@superhero/oas/components/headers'
import config           from '../config.json' with { type: 'json' }

suite('@superhero/oas/headers', () =>
{
  const headers = new Headers(config.oas)

  suite('conform', () =>
  {
    test('returns instance as-is if no schema and not required', () =>
    {
      const component = { description: 'Optional header' }
      const instance  = 'foobar'
      const conformed = headers.conform(component, instance)
      assert.strictEqual(conformed, instance)
    })

    test('throws if required and missing', () =>
    {
      const component = { required: true }
      assert.throws(() => headers.conform(component), { code: 'E_OAS_INVALID_HEADER' })
    })

    test('returns undefined if not required and instance is missing', () =>
    {
      const component = { required: false }
      const conformed = headers.conform(component)
      assert.strictEqual(conformed, undefined)
    })

    test('validates schema if present', () =>
    {
      const component = { schema: { type: 'integer' } }
      const instance  = 42
      const conformed = headers.conform(component, instance)
      assert.strictEqual(conformed, instance)
    })

    test('throws if schema validation fails', () =>
    {
      const component = { schema: { type: 'integer' } }
      assert.throws(() => headers.conform(component, 'invalid'), { code: 'E_OAS_INVALID_HEADER' })
    })

    test('returns conformed value from schema', () =>
    {
      const component = { schema: { type: 'boolean' } }
      const conformed = headers.conform(component, 'true')
      assert.strictEqual(conformed, true)
    })

    test('throws if $ref is invalid', () =>
    {
      const component = { $ref: '#/components/invalid/' }
      assert.throws(() => headers.conform(component, 'foobar'), { code: 'E_OAS_INVALID_HEADER' })
    })
  })
})
