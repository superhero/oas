import Schemas          from '@superhero/oas/components/schemas'
import assert           from 'node:assert'
import { suite, test }  from 'node:test'

suite('@superhero/oas/schemas', () => 
{
  const schemas = new Schemas()

  suite('Supported attributes', () =>
  {
    test('type:boolean', async (sub) => 
    {
      const component = { type: 'boolean' }
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = false
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, instance)

      await sub.test('nullable enum', () =>
      {
        const component = { type: 'boolean', nullable: true, enum: [true, null] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = null
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('throws if invalid enum type', () =>
      {
        const component = { type: 'boolean', enum: [1,2] }
        assert.throws(() => schemas.validateComponent(component))
      })

      await sub.test('casts strings that can be interpreted as a boolean value to boolean', () =>
      {
        // true
        assert.strictEqual(schemas.conform(component, 'true'),  true)
        assert.strictEqual(schemas.conform(component, 'on'),    true)
        assert.strictEqual(schemas.conform(component, '1'),     true)
        assert.strictEqual(schemas.conform(component, 1),       true)
        // false
        assert.strictEqual(schemas.conform(component, 'FALSE'), false)
        assert.strictEqual(schemas.conform(component, 'OFF'),   false)
        assert.strictEqual(schemas.conform(component, '0'),     false)
        assert.strictEqual(schemas.conform(component, 0),       false)
      })

      await sub.test('throws if invalid', () =>
      {
        assert.throws(() => schemas.conform(component, 'invalid'))
      })
    })

    test('type:integer', async (sub) => 
    {
      const component = { type: 'integer' }
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = 123
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, instance)

      await sub.test('nullable enum', () =>
      {
        const component = { type: 'integer', nullable: true, enum: [1, 2, null] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = null
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('minimum', () =>
      {
        const component = { type: 'integer', minimum: 2 }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 1))
      })

      await sub.test('maximum', () =>
      {
        const component = { type: 'integer', maximum: 2 }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 3))
      })

      await sub.test('exclusiveMinimum', () =>
      {
        const component = { type: 'integer', minimum: 2, exclusiveMinimum: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 2))
      })

      await sub.test('exclusiveMaximum', () =>
      {
        const component = { type: 'integer', maximum: 2, exclusiveMaximum: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 2))
      })

      await sub.test('multipleOf', () =>
      {
        const component = { type: 'integer', multipleOf: 2 }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 4))
        assert.throws(() => schemas.conform(component, 3))
      })

      await sub.test('format int32', () =>
      {
        const component = { type: 'integer', format: 'int32' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 2147483647))
        assert.throws(() => schemas.conform(component, 2147483648))
      })

      await sub.test('format int64', () =>
      {
        const component = { type: 'integer', format: 'int64' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 9007199254740991))
        assert.throws(() => schemas.conform(component, 9007199254740992))
      })

      await sub.test('throws if invalid format', () =>
      {
        const component = { type: 'integer', format: 'invalid' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 123))
      })

      await sub.test('throws if invalid enum type', () =>
      {
        const component = { type: 'integer', enum: ['foo', 'bar'] }
        assert.throws(() => schemas.validateComponent(component))
      })

      await sub.test('throws if a decimal', () =>
      {
        assert.throws(() => schemas.conform(component, 123.45))
      })
    })

    test('type:number', async (sub) => 
    {
      const component = { type: 'number' }
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = 123.45
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, instance)

      await sub.test('nullable enum', () =>
      {
        const component = { type: 'number', nullable: true, enum: [1, 2, null] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = null
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('format float', () =>
      {
        const component = { type: 'number', format: 'float' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 123.45))
      })

      await sub.test('format double', () =>
      {
        const component = { type: 'number', format: 'double' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 123.45))
      })

      await sub.test('throws if invalid enum type', () =>
      {
        const component = { type: 'number', enum: ['foo', 'bar'] }
        assert.throws(() => schemas.validateComponent(component))
      })

      await sub.test('casts strings that can be interpreted as a number value to number', () =>
      {
        assert.strictEqual(schemas.conform(component, '123.456'), 123.456)
      })
    })

    test('type:string', async (sub) => 
    {
      const component = { type: 'string' }
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = 'foobar'
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, instance)

      await sub.test('nullable enum', () =>
      {
        const component = { type: 'string', nullable: true, enum: ['foo', 'bar', null] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = null
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('minLength', () =>
      {
        const component = { type: 'string', minLength: 4 }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 'foo'))
      })

      await sub.test('maxLength', () =>
      {
        const component = { type: 'string', maxLength: 4 }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 'foobar'))
      })

      await sub.test('pattern', () =>
      {
        const component = { type: 'string', pattern: '^foo' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 'foobar'))
        assert.throws(() => schemas.conform(component, 'barfoo'))
      })

      await sub.test('format date', () =>
      {
        const component = { type: 'string', format: 'date' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, '2021-01-01'))
        assert.throws(() => schemas.conform(component, '2021-13-01'))
      })

      await sub.test('format time', () =>
      {
        const component = { type: 'string', format: 'time' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, '00:00:00'))
        assert.throws(() => schemas.conform(component, '00:00:60'))
      })

      await sub.test('format datetime', () =>
      {
        const component = { type: 'string', format: 'date-time' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, '2021-01-01T00:00:00Z'))
        assert.throws(() => schemas.conform(component, 'invalid'))
      })

      await sub.test('format base64', () =>
      {
        const component = { type: 'string', format: 'base64' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 'Zm9vYmFy'))
        assert.throws(() => schemas.conform(component, '~'))
      })

      await sub.test('format email', () =>
      {
        const component = { type: 'string', format: 'email' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, 'example@example.com'))
        assert.throws(() => schemas.conform(component, 'invalid'))
      })

      await sub.test('format ipv4', () =>
      {
        const component = { type: 'string', format: 'ipv4' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, '127.0.0.1'))
        assert.doesNotThrow(() => schemas.conform(component, '0.0.0.0'))
        assert.doesNotThrow(() => schemas.conform(component, '255.255.255.255'))
        assert.throws(() => schemas.conform(component, 'invalid'))
        assert.throws(() => schemas.conform(component, '255.255.255.255.255'))
        assert.throws(() => schemas.conform(component, '355.255.255.255'))
        assert.throws(() => schemas.conform(component, '255.265.255.255'))
        assert.throws(() => schemas.conform(component, '255.255.256.255'))
        assert.throws(() => schemas.conform(component, '255.255.255.256'))
        assert.throws(() => schemas.conform(component, '255.255.255.a'))
        assert.throws(() => schemas.conform(component, '255.255.255.-1'))
        assert.throws(() => schemas.conform(component, '...'))
      })

      await sub.test('format ipv6', () =>
      {
        const component = { type: 'string', format: 'ipv6' }

        assert.doesNotThrow(() => schemas.validateComponent(component))
        
        assert.doesNotThrow(() => schemas.conform(component, '2001:0db8:85a3:0000:0000:8a2e:0370:7334'), 'Fully expanded IPv6 address')
        assert.doesNotThrow(() => schemas.conform(component, '2001:db8:85a3:0:0:8a2e:370:7334'), 'Shortened IPv6 address, with zero compression')
        assert.doesNotThrow(() => schemas.conform(component, '2001:db8:85a3::8a2e:370:7334'), 'Compressed IPv6 address, :: replaces consecutive zeros')
        assert.doesNotThrow(() => schemas.conform(component, '2001:db8::1'), 'Compressed IPv6 address, :: 2')
        assert.doesNotThrow(() => schemas.conform(component, '2001:db8::', 'Compressed IPv6 address, :: 3'))
        assert.doesNotThrow(() => schemas.conform(component, '2001::', 'Compressed IPv6 address, :: 4'))
        assert.doesNotThrow(() => schemas.conform(component, '2001::1', 'Compressed IPv6 address with one trailing value'))
        assert.doesNotThrow(() => schemas.conform(component, '::1', 'Compressed IPv6 address representing the loopback address'))
        assert.doesNotThrow(() => schemas.conform(component, '::', 'Compressed IPv6 address representing all zeroes'))
        assert.doesNotThrow(() => schemas.conform(component, '::ffff:192.168.1.1', 'IPv4-mapped IPv6 address'))

        assert.throws(() => schemas.conform(component, 'invalid', 'Invalid IPv6 address'))
        assert.throws(() => schemas.conform(component, '2001:::1', 'Triple colons'))
        assert.throws(() => schemas.conform(component, '2001:db8:85a3:xyz:0:8a2e:370:7334', 'Non-hex chars'))
        assert.throws(() => schemas.conform(component, '2001:db8:85a3:0:0:8a2e:370:7334:1234', 'Too many groups'))
      })

      await sub.test('url', () =>
      {
        const component = { type: 'string', format: 'url' }

        assert.doesNotThrow(() => schemas.validateComponent(component))

        assert.doesNotThrow(() => schemas.conform(component, 'https://example.com'))
        assert.doesNotThrow(() => schemas.conform(component, 'http://example.com'))
        assert.doesNotThrow(() => schemas.conform(component, 'ftps://example.com'))
        assert.doesNotThrow(() => schemas.conform(component, 'ftp://example.com'))
        assert.doesNotThrow(() => schemas.conform(component, 'ws://example.com'))

        assert.throws(() => schemas.conform(component, '://example.com'))
        assert.throws(() => schemas.conform(component, '//example.com'))
        assert.throws(() => schemas.conform(component, 'example.com'))
        assert.throws(() => schemas.conform(component, 'example'))
      })

      await sub.test('format uuid', () =>
      {
        const component = { type: 'string', format: 'uuid' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, '550e8400-e29b-41d4-a716-446655440000'))
        assert.throws(() => schemas.conform(component, 'invalid'))
      })

      await sub.test('throws if invalid enum type', () =>
      {
        const component = { type: 'string', enum: [1, 2] }
        assert.throws(() => schemas.validateComponent(component))
      })
    })

    test('type:null', async (sub) => 
    {
      const component = { type: 'null' }
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = ''
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, null)

      await sub.test('throws if not null', () =>
      {
        assert.throws(() => schemas.conform(component, 'foobar'))
      })

      await sub.test('throws if value is null and type is not null', () =>
      {
        const component = { type: 'string' }
        assert.throws(() => schemas.conform(component, null))
      })
    })

    test('type:undefined', () =>
    {
      const component = {}
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = 'foobar'
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, instance)
    })

    test('type:array', async (sub) => 
    {
      const component = { type: 'array' }
      assert.throws(() => schemas.validateComponent(component))
      assert.throws(() => schemas.conform(component, [1,2,3]))

      await sub.test('throws if invalid type', () =>
      {
        const component = { type: 'array', items: { type: 'integer' } }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 'foobar'))
      })

      await sub.test('items', () =>
      {
        const component = { type: 'array', items: { type: 'integer' } }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = [1,2,3]
        const conformed = schemas.conform(component, instance)
        assert.deepStrictEqual(conformed, instance)
      })

      await sub.test('additionalItems', () =>
      {
        const component = { type: 'array', items: { type: 'integer' }, additionalItems: false }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, [1,2]))
      })

      await sub.test('minItems', () =>
      {
        const component = { type: 'array', items: { type: 'integer' }, minItems: 2 }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, [1]))
      })

      await sub.test('maxItems', () =>
      {
        const component = { type: 'array', items: { type: 'integer' }, maxItems: 2 }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, [1,2,3]))
      })

      await sub.test('uniqueItems', () =>
      {
        const component = { type: 'array', items: { type: 'integer' }, uniqueItems: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, [1,2,3]))
        assert.deepStrictEqual(schemas.conform(component, [1,1,2]), [1,2])
      })

      await sub.test('enum', () =>
      {
        const component = { type: 'array', items: { type: 'integer' }, enum: [[1,2], [3,4]] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = [1,2]
        const conformed = schemas.conform(component, instance)
        assert.deepStrictEqual(conformed, instance)
      })

      await sub.test('throws if invalid enum type', () =>
      {
        const component = { type: 'array', items: { type: 'integer' }, enum: [1, 2] }
        assert.throws(() => schemas.validateComponent(component))
      })

      await sub.test('nullable enum', () =>
      {
        const component = { type: 'array', items: { type: 'integer' }, nullable: true, enum: [[1,2], [3,4], null] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = null
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('nullable items', () =>
      {
        const component = { type: 'array', items: { type: 'integer', nullable: true } }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = [1,null,3]
        const conformed = schemas.conform(component, instance)
        assert.deepStrictEqual(conformed, instance)
      })

      await sub.test('nullable enum items', () =>
      {
        const component = { type: 'array', items: { type: 'integer', nullable: true }, enum: [[1,null], [2,3]] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = [1,null]
        const conformed = schemas.conform(component, instance)
        assert.deepStrictEqual(conformed, instance)
      })
    })

    test('type:object', async (sub) => 
    {
      const component = 
      { type: 'object', properties: { foo: { type: 'object', 
                        properties: { bar: { type: 'object', 
                        properties: { baz: { type: 'string' }}}}}}}

      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = { foo: { bar: { baz: 'quz' }}}
      const conformed = schemas.conform(component, instance)
      assert.deepStrictEqual(conformed, instance)

      await sub.test('throws if invalid type', () =>
      {
        const component = { type: 'object' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 'foobar'))
      })

      await sub.test('additionalProperties', () =>
      {
        const component = { type: 'object', additionalProperties: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = { foo: 'bar' }
        const conformed = schemas.conform(component, instance)
        assert.deepStrictEqual(conformed, instance)
        component.additionalProperties = false
        assert.deepStrictEqual(schemas.conform(component, instance), {})
      })

      await sub.test('minProperties', () =>
      {
        const component = { type: 'object', minProperties: 2, additionalProperties: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, { foo: 'bar' }))
      })

      await sub.test('maxProperties', () =>
      {
        const component = { type: 'object', maxProperties: 2, additionalProperties: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, { foo: 'bar', bar: 'baz', baz: 'qux' }))
      })

      await sub.test('propertyNames pattern', () =>
      {
        const component = { type: 'object', propertyNames: { pattern: '^foo' }, additionalProperties: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.doesNotThrow(() => schemas.conform(component, { foo: 'bar' }))
        assert.throws(() => schemas.conform(component, { bar: 'foo' }))
      })

      await sub.test('nullable', () =>
      {
        const component = { type: 'object', nullable: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = null
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('enum', () =>
      {
        const component = { type: 'object', properties: { foo: { type: 'string' }}, enum: [{ foo: 'bar' }] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = { foo: 'bar' }
        const conformed = schemas.conform(component, instance)
        assert.deepStrictEqual(conformed, instance)
      })

      await sub.test('nullable enum', () =>
      {
        const component = { type: 'object', properties: { foo: { type: 'string' }}, nullable: true, enum: [{ foo: 'bar' }, null] }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = null
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('throws if invalid enum type', () =>
      {
        const component = { type: 'object', properties: { foo: { type: 'string' }}, enum: ['foo', 'bar'] }
        assert.throws(() => schemas.validateComponent(component))
      })
    })

    test('type:invalid throws', () =>
    {
      const component = { type: 'invalid' }
      assert.throws(() => schemas.validateComponent(component))
      assert.throws(() => schemas.conform(component, 'foobar'))
    })

    test('readOnly', async (sub) =>
    {
      await sub.test('when is reading', () =>
      {
        const component = { type: 'string', readOnly: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = 'foobar'
        const conformed = schemas.conform(component, instance, false)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('when is writing', () =>
      {
        const component = { type: 'string', readOnly: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = 'foobar'
        const conformed = schemas.conform(component, instance, true)
        assert.strictEqual(conformed, undefined)
      })
    })

    test('writeOnly', async (sub) =>
    {
      await sub.test('when is reading', () =>
      {
        const component = { type: 'string', writeOnly: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = 'foobar'
        const conformed = schemas.conform(component, instance, false)
        assert.strictEqual(conformed, undefined)
      })

      await sub.test('when is writing', () =>
      {
        const component = { type: 'string', writeOnly: true }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = 'foobar'
        const conformed = schemas.conform(component, instance, true)
        assert.strictEqual(conformed, instance)
      })
    })

    test('default', async (sub) =>
    {
      await sub.test('when no value', () =>
      {
        const component = { type: 'string', default: 'foobar' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = undefined
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, component.default)
      })

      await sub.test('when value', () =>
      {
        const component = { type: 'string', default: 'foobar' }
        assert.doesNotThrow(() => schemas.validateComponent(component))
        const instance  = 'quz'
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })
    })

    test('if/then/else', async (sub) =>
    {
      const component = 
      { if:   { type: 'string' }, 
        then: { enum: ['foo','bar'] }, 
        else: { enum: [13,42] }}

      assert.doesNotThrow(() => schemas.validateComponent(component))

      await sub.test('then', () =>
      {
        const instance  = 'foo'
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('else', () =>
      {
        const instance  = 42
        const conformed = schemas.conform(component, instance)
        assert.strictEqual(conformed, instance)
      })

      await sub.test('throws if invalid', () =>
      {
        const instance = 'woops'
        assert.throws(() => schemas.conform(component, instance))
      })
    })

    test('not', () =>
    {
      const component = { not: { type: 'string' }}
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = 123
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, instance)
      assert.throws(() => schemas.conform(component, 'foobar'))
    })

    test('allOf', async (sub) =>
    {
      const component = 
        { allOf: 
          [ { type: 'object', properties: { foo: { type: 'string' }}},
            { type: 'object', properties: { bar: { type: 'string' }}, required: [ 'bar' ] } ] }

      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = { foo: 'foo', bar: 'bar' }
      const conformed = schemas.conform(component, instance)
      assert.deepStrictEqual(conformed, instance)

      await sub.test('result only what is expected', () =>
      {
        const instance = { foo: 'foo', bar: 'bar', baz: 'baz' }
        const conformed = schemas.conform(component, instance)
        assert.deepStrictEqual(conformed, { foo: 'foo', bar: 'bar' })
      })

      await sub.test('throws if all are not valid', () =>
      {
        const instance = { foo: 'foo' }
        assert.throws(() => schemas.conform(component, instance))
      })
    })

    test('anyOf', async (sub) =>
    {
      const component = 
        { anyOf:
          [ { type: 'string' },
            { type: 'integer' } ] }

      assert.doesNotThrow(() => schemas.validateComponent(component))

      await sub.test('conforms to valid schema', () =>
      {
        for(const instance of [ 'foo', 123 ])
        {
          const conformed = schemas.conform(component, instance)
          assert.strictEqual(conformed, instance)
        }
      })

      await sub.test('throws if none is valid', () =>
      {
        assert.throws(() => schemas.conform(component, { foo: 'bar' }))
      })
    })

    test('oneOf', async (sub) =>
    {
      const component = 
        { oneOf:
          [ { type: 'string' },
            { type: 'integer' } ] }

      assert.doesNotThrow(() => schemas.validateComponent(component))

      await sub.test('conforms to valid schema', () =>
      {
        for(const instance of [ 'foo', 123 ])
        {
          const conformed = schemas.conform(component, instance)
          assert.strictEqual(conformed, instance)
        }
      })

      await sub.test('throws if none is valid', () =>
      {
        assert.throws(() => schemas.conform(component, { foo: 'bar' }))
      })

      await sub.test('throws if more than one is valid', () =>
      {
        const component = 
          { oneOf:
            [ { type: 'string' },
              { type: 'string' } ] }
  
        assert.doesNotThrow(() => schemas.validateComponent(component))
        assert.throws(() => schemas.conform(component, 'foobar'))
      })
    })

    test('const', async () =>
    {
      const component = { const: 'foo' }
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = 'foo'
      const conformed = schemas.conform(component, instance)
      assert.strictEqual(conformed, instance)
      assert.throws(() => schemas.conform(component, 'bar'))
    })

    test('deep const', async () =>
    {
      const component = { const: { foo: 'foo' }}
      assert.doesNotThrow(() => schemas.validateComponent(component))
      const instance  = { foo: 'foo' }
      const conformed = schemas.conform(component, instance)
      assert.deepStrictEqual(conformed, instance)
      assert.throws(() => schemas.conform(component, { foo: 'bar' }))
    })

    test('throws on invalid $ref', () =>
    {
      const component = { '$ref': '#/components/invalid/' }
      assert.doesNotThrow(() => schemas.validateComponent(component))
      assert.throws(
        () => schemas.conform(component, 'foobar'),
        { code: 'E_OAS_INVALID_SPECIFICATION' })
    })

    test('throws on invalid schema', () =>
    {
      assert.throws(() => schemas.validateComponent({ foo: 'bar' }))
      assert.throws(() => schemas.validateComponent({ type: 'object', items: {}}))
    })
  })
})
