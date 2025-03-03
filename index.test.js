import Config   from '@superhero/config'
import Locate   from '@superhero/locator'
import Request  from '@superhero/http-request'
import assert   from 'node:assert'
import path     from 'node:path'
import util     from 'node:util'
import { suite, test, beforeEach } from 'node:test'

util.inspect.defaultOptions.depth = 5

suite('@superhero/oas', () => 
{
  let locate, config, oas

  beforeEach(async () => 
  {
    if(beforeEach.skip)
    {
      return
    }

    locate = new Locate()
    config = new Config()
    locate.set('@superhero/config', config)
    
    {
      const { filepath, config: resolved } = await config.resolve('@superhero/http-server')
      config.add(filepath, resolved)
    }
    
    locate.pathResolver.basePath = path.resolve('./node_modules/@superhero/http-server')
    await locate.eagerload(config.find('locator'))
    locate.pathResolver.basePath = path.resolve('.')

    {
      const { filepath, config: resolved } = await config.resolve(path.resolve('./config.json'))
      await config.add(filepath, resolved)
    }

    await locate.eagerload(
    {
      '@superhero/oas'                           : path.resolve('./index.js'),
      // middleware
      '@superhero/oas/middleware/parameters'     : path.resolve('./middleware/parameters.js'),
      '@superhero/oas/middleware/request-bodies' : path.resolve('./middleware/request-bodies.js'),
      '@superhero/oas/middleware/responses'      : path.resolve('./middleware/responses.js')
    })

    oas = locate('@superhero/oas')

    locate.set('placeholder', { dispatch: () => 'placeholder' })
  })

  test('Can set a simple specification', () => 
  {
    const specification = 
      { paths:
        { '/foo': 
          { get:  { operationId: 'placeholder#1', responses: { 200: {} }},
            post: { operationId: 'placeholder#2', responses: { 200: {} }}
          },
          '/bar':
          { put:  { operationId: 'placeholder#3', responses: { 200: {} }} }}}

    config.assign(specification)
    oas.bootstrap(specification)

    assert.ok(oas.router.has('oas/paths/~/foo'), 'Route for /foo should be added')
    assert.ok(oas.router.has('oas/paths/~/bar'), 'Route for /bar should be added')
  })

  test('Can add middleware for requestBody content', () => 
  {
    const specification =
      { paths:
        { '/foo':
          { post:
            { operationId : 'placeholder',
              requestBody : { content: { 'application/json': {} } },
              responses   : { 200: {} } }}}}

    config.assign(specification)
    oas.bootstrap(specification)

    const
      route             = oas.router.get('oas/paths/~/foo'),
      hasRequestBodies  = route.route.middleware.includes('@superhero/oas/middleware/request-bodies')

    assert.ok(hasRequestBodies, 'Middleware for requestBody should be added')
    assert.equal(
      route.route['content-type.application/json'],
      '@superhero/http-server/dispatcher/upstream/header/content-type/application/json')
  })

  test('Can add middleware for parameters', () => 
  {
    const specification = 
      { paths: 
        { '/foo': 
          { get: 
            { operationId : 'placeholder',
              parameters  : [],
              responses   : { 200: {} } }}}}

    config.assign(specification)
    oas.bootstrap(specification)

    const
      route         = oas.router.get('oas/paths/~/foo'),
      hasParameters = route.route.middleware.includes('@superhero/oas/middleware/parameters')

    assert.ok(hasParameters, 'Middleware for parameters should be added')
  })

  test('Specification with reference to components', async (sub) => 
  {
    const specification =
      { components:
        { headers:
          { ContentType: 
            { required: true, 
              schema: { type: 'string' }}
          },
          parameters:
          { DefaultFoo:   { name: 'foo', in: 'query',  required: true,  schema: { '$ref': '#/components/schemas/String' }, nullable: true, default: null },
            RequiredFoo:  { name: 'foo', in: 'query',  required: true,  schema: { '$ref': '#/components/schemas/String' }},
            PathFoo:      { name: 'foo', in: 'path',   required: true,  schema: { '$ref': '#/components/schemas/String' }},
            QueryFoo:     { name: 'foo', in: 'query',  required: false, schema: { '$ref': '#/components/schemas/String' }},
            HeaderFoo:    { name: 'foo', in: 'header', required: false, schema: { '$ref': '#/components/schemas/String' }}
          },
          requestBodies:
          { ExampleRequestBody: { '$ref': '#/components/requestBodies/GenericRequestBody' },
            GenericRequestBody:
            { required: true,
              content: { 'application/json': { schema: { '$ref': '#/components/schemas/Foo' }}}}
          },
          responses:
          { SuccessResult:
            { description: 'Successful result',
              headers: { 'Content-Type': { '$ref': '#/components/headers/ContentType' }},
              content: { 'application/json': { schema: { '$ref': '#/components/schemas/Result' }}}
            },
            BadRequest:
            { description: 'Bad Request',
              schema: { '$ref': '#/components/schemas/Result' }}
          },
          schemas:
          { String: { type: 'string' },
            Foo:
            { type: 'object',
              properties: { foo: { '$ref': '#/components/schemas/String' }}},
            Result:
            { type: 'object',
              properties: { result: { '$ref': '#/components/schemas/String' } }}
          }
        },
        paths:
        { '/example/default':
          { get:
            { operationId: 'test/dispatcher/1#default',
              parameters: [{ '$ref': '#/components/parameters/DefaultFoo' }],
              responses:
              { 200: { '$ref': '#/components/responses/SuccessResult' },
                400: { '$ref': '#/components/responses/BadRequest' }}}
          },
          '/example/required':
          { get:
            { operationId: 'test/dispatcher/1#required',
              parameters: [{ '$ref': '#/components/parameters/RequiredFoo' }],
              responses:
              { 200: { '$ref': '#/components/responses/SuccessResult' },
                400: { '$ref': '#/components/responses/BadRequest' }}}
          },
          '/example/{foo}':
          { get:
            { operationId: 'test/dispatcher/1#path',
              parameters: [{ '$ref': '#/components/parameters/PathFoo' }],
              responses:
              { 200: { '$ref': '#/components/responses/SuccessResult' },
                400: { '$ref': '#/components/responses/BadRequest' }}}
          },
          '/example':
          { get:
            { operationId: 'test/dispatcher/1#query',
              parameters:
              [ { '$ref': '#/components/parameters/QueryFoo'  },
                { '$ref': '#/components/parameters/HeaderFoo' }
              ],
              responses:
              { 200: { '$ref': '#/components/responses/SuccessResult' },
                400: { '$ref': '#/components/responses/BadRequest' }}
            },
            post:
            { operationId: 'test/dispatcher/2',
              requestBody: { '$ref': '#/components/requestBodies/ExampleRequestBody' },
              responses:
              { 200: { '$ref': '#/components/responses/SuccessResult' },
                400: { '$ref': '#/components/responses/BadRequest' }}}}}}

    locate.set('test/dispatcher/1', { dispatch: (request, session) => session.view.body.result = request.param.foo })
    locate.set('test/dispatcher/2', { dispatch: (request, session) => session.view.body.result = request.body.foo })

    config.assign(specification)
    oas.bootstrap(specification)

    const route = oas.router.get('oas/paths/~/example')

    assert.ok(route, 'route for /example should exist')
    assert.ok(route.route.middleware.includes('@superhero/oas/middleware/parameters'))
    assert.ok(route.route.middleware.includes('@superhero/oas/middleware/responses'))
    assert.ok(route.route.middleware.includes('@superhero/oas/middleware/request-bodies'))
    assert.ok(route.route.middleware.includes('@superhero/http-server/dispatcher/upstream/header/content-type'))

    assert.equal(route.route['content-type.application/json'], '@superhero/http-server/dispatcher/upstream/header/content-type/application/json')

    assert.equal(route.route['method.get'],  'test/dispatcher/1', 'Correct dispathcer for GET method')
    assert.equal(route.route['method.post'], 'test/dispatcher/2', 'Correct dispathcer for POST method')

    const httpServer = locate('@superhero/http-server')
    await httpServer.bootstrap()
    await httpServer.listen()

    beforeEach.skip = true

    await sub.test('GET method using default parameter', async () =>
    {
      const
        baseUrl   = `http://localhost:${httpServer.gateway.address().port}`,
        request   = new Request({ url: baseUrl, doNotThrowOnErrorStatus: true }),
        response  = await request.get({ url: '/example/default', headers: { 'connection': 'close', 'content-type': 'application/json' }})

      assert.equal(response.status, 200, '200 status code for GET method')
      assert.equal(response.body.result, null, 'Correct response body for GET method')
    })

    await sub.test('GET method not using required parameter', async () =>
    {
      const
        baseUrl   = `http://localhost:${httpServer.gateway.address().port}`,
        request   = new Request({ url: baseUrl, doNotThrowOnErrorStatus: true }),
        response  = await request.get({ url: '/example/required', headers: { 'connection': 'close', 'content-type': 'application/json' }})

      assert.equal(response.status, 400, '400 status code for GET method')
    })

    await sub.test('GET method using path parameter', async () =>
    {
      const
        baseUrl   = `http://localhost:${httpServer.gateway.address().port}`,
        request   = new Request({ url: baseUrl, doNotThrowOnErrorStatus: true }),
        response  = await request.get({ url: '/example/path', headers: { 'connection': 'close', 'content-type': 'application/json' }})

      assert.equal(response.status, 200, '200 status code for GET method')
      assert.equal(response.body.result, 'path', 'Correct response body for GET method')
    })

    await sub.test('GET method using query parameter', async () =>
    {
      const
        baseUrl   = `http://localhost:${httpServer.gateway.address().port}`,
        request   = new Request({ url: baseUrl, doNotThrowOnErrorStatus: true }),
        response  = await request.get({ url: '/example?foo=query', headers: { 'connection': 'close', 'content-type': 'application/json' }})

      assert.equal(response.status, 200, '200 status code for GET method')
      assert.equal(response.body.result, 'query', 'Correct response body for GET method')
    })

    await sub.test('GET method using header parameter', async () =>
    {
      const
        baseUrl   = `http://localhost:${httpServer.gateway.address().port}`,
        request   = new Request({ url: baseUrl, doNotThrowOnErrorStatus: true }),
        response  = await request.get({ url: '/example', headers: { 'foo':'header', 'connection': 'close', 'content-type': 'application/json' }})

      assert.equal(response.status, 200, '200 status code for GET method')
      assert.equal(response.body.result, 'header', 'Correct response body for GET method')
    })

    await sub.test('POST method using request body', async () =>
    {
      const
        baseUrl   = `http://localhost:${httpServer.gateway.address().port}`,
        request   = new Request({ url: baseUrl, doNotThrowOnErrorStatus: true }),
        response  = await request.post({ url: '/example', body: { foo: 'body' }, headers: { 'connection': 'close', 'content-type': 'application/json' }})

      assert.equal(response.status, 200, '200 status code for POST method')
      assert.equal(response.body.result, 'body', 'Correct response body for POST method')
    })

    beforeEach.skip = false

    await httpServer.close()
  })

  test('Throws error for invalid paths type in specification', () => 
  {
    assert.throws(
      () => oas.bootstrap({ paths: 'invalid' }),
      { code: 'E_OAS_INVALID_SPECIFICATION' },
      'Should throw due to invalid paths type')
  })

  test('Throws error for missing response', () => 
  {
    const invalidSpecification = 
      { paths: { '/foo': { get: { operationId : 'placeholder' }}}}

    config.assign(invalidSpecification)
    assert.throws(
      () => oas.bootstrap(invalidSpecification),
      { code: 'E_OAS_INVALID_SPECIFICATION' },
      'Should throw due to missing status code attribute')
  })

  test('Throws error for missing operationId in operation', () => 
  {
    const invalidSpecification = 
      { paths: { '/foo': { get: { responses: { 200: {} } }}}}

    assert.throws(
      () => oas.bootstrap(invalidSpecification),
      { code: 'E_OAS_UNSUPORTED_SPECIFICATION' },
      'Should throw due to missing operationId')
  })

  test('Throws error for missing responses in operation', () => 
  {
    const invalidSpecification = 
      { paths: { '/foo': { get: { operationId: 'placeholder' }}}}

    assert.throws(
      () => oas.bootstrap(invalidSpecification),
      { code: 'E_OAS_INVALID_SPECIFICATION' },
      'Should throw due to missing responses')
  })

  test('Throws error for missing response code', () => 
  {
    const invalidSpecification = 
      { paths:
        { '/foo': 
          { get: 
            { operationId : 'placeholder', 
              responses   : {} }}}}

    config.assign(invalidSpecification)
    assert.throws(
      () => oas.bootstrap(invalidSpecification),
      { code: 'E_OAS_INVALID_SPECIFICATION' },
      'Should throw due to missing status code attribute')
  })

  test('Throws error for unsupported content type in requestBody', () => 
  {
    const invalidSpecification = 
      { paths: 
        { '/foo': 
          { post: 
            { operationId : 'placeholder',
              requestBody : { content: { 'unsupported/type': {} } },
              responses   : { 200: {} } }}}}

    assert.throws(
      () => oas.bootstrap(invalidSpecification),
      { code: 'E_OAS_UNSUPORTED_SPECIFICATION' },
      'Should throw due to unsupported content type')
  })

  test('Throws error for invalid parameters type', () => 
  {
    const invalidSpecification = 
      { paths:
        { '/foo':
          { get:
            { operationId : 'placeholder',
              parameters  : 'invalid',
              responses   : { 200: {} }}}}}

    assert.throws(
      () => oas.bootstrap(invalidSpecification),
      { code: 'E_OAS_INVALID_SPECIFICATION' },
      'Should throw due to invalid parameters type')
  })
})
