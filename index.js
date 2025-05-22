import Headers        from '@superhero/oas/components/headers'
import Parameters     from '@superhero/oas/components/parameters'
import RequestBodies  from '@superhero/oas/components/request-bodies'
import Responses      from '@superhero/oas/components/responses'
import Schemas        from '@superhero/oas/components/schemas'
import path           from 'node:path'
import fs             from 'node:fs/promises'

export async function locate(locator)
{
  const
    server        = locator('@superhero/http-server'),
    specification = await findSpecification(locator.config)

  return new OAS(server, specification)
}

/**
 * Find the OpenAPI Specification in the configuration, and locates it from disk 
 * if a string path is configured.
 * 
 * @param {'@superhero/config'} config
 * @returns {Promise<Object>} The OpenAPI Specification object.
 */
export async function findSpecification(config)
{
  let specification = config.find('oas')

  if('string' === typeof specification)
  {
    if(false === path.isAbsolute(specification))
    {
      const absolute = config.findAbsoluteDirPathByConfigEntry('oas', specification)
      specification  = path.join(absolute, specification)
    }

    specification = await fs.readFile(specification, 'utf8')
    specification = JSON.parse(specification)
  }

  return specification
}

export default class OAS
{
  constructor(server, specification)
  {
    this.server         = server
    this.router         = server.router
    this.specification  = specification

    this.schemas        = new Schemas(specification)
    this.headers        = new Headers(specification, this.schemas)
    this.parameters     = new Parameters(specification, this.schemas)
    this.requestBodies  = new RequestBodies(specification, this.schemas)
    this.responses      = new Responses(specification, this.schemas, this.headers)
  }

  bootstrap()
  {
    this.setSpecification(this.router, this.specification)
  }

  setSpecification(router, specification)
  {
    this.validatePathsType(specification?.paths)

    for(const path in specification.paths)
    {
      try
      {
        const route = this.createRoute(specification.paths[path])
        route.criteria = path.replace(/\{([^}]+)\}/g, ':$1'),
        router.set('oas/paths/~' + path, route)
      }
      catch(reason)
      {
        const error = new Error(`Invalid specification for path "${path}"`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        error.cause = reason
        throw error
      }
    }
  }

  validatePathsType(paths)
  {
    const pathsType = Object.prototype.toString.call(paths)

    if('[object Object]' !== pathsType)
    {
      const error = new Error('The paths property in the specification must be of type [object Object]')
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = `The paths property in the specification is of invalid type ${pathsType}`
      throw error
    }
  }

  createRoute(pathObject)
  {
    const
      dispatcher  = '@superhero/http-server/dispatcher/upstream/method',
      route       = { dispatcher },
      oas         = {}

    for(let method in pathObject)
    {
      const operation = pathObject[method]

      try
      {
        this.validateOperation(operation)
        method = method.toLowerCase()
        route['method.' + method] = this.transformOperationIdToDispatcherName(operation.operationId)
        oas[method.toUpperCase()] = operation
      }
      catch(reason)
      {
        const error = new Error(`Invalid operation "${operation.operationId}" in "${method}"`)
        error.code  = 'E_OAS_INVALID_OPERATION'
        error.cause = reason
        throw error
      }
    }

    Object.defineProperty(route, 'oas', { value: oas })

    const
      contentTypeDispatcherPrefix = '@superhero/http-server/dispatcher/upstream/header/content-type/',
      contentType                 = 'application/json'

    route['content-type.' + contentType] = contentTypeDispatcherPrefix + contentType

    route.middleware =
    [
      '@superhero/oas/middleware/parameters',
      '@superhero/http-server/dispatcher/upstream/header/content-type',
      '@superhero/oas/middleware/request-bodies',
      '@superhero/oas/middleware/responses'
    ]

    return route
  }

  validateOperation(operation)
  {
    if(false === 'operationId' in operation)
    {
      const error = new TypeError(`The operation must define an operationId`)
      error.code  = 'E_OAS_MISSING_OPERATION_ID'
      error.cause = `The operationId is expected to define a valid dispatcher for the operation`
      throw error
    }

    try
    {
      const 
        serviceName = this.transformOperationIdToDispatcherName(operation.operationId),
        dispatcher  = this.router.locate(serviceName)

      if(false === 'dispatch' in dispatcher)
      {
        const error = new Error(`Dispatcher "${serviceName}" does not have the expected dispatch method`)
        error.code = 'E_OAS_DISPATCHER_MISSING_DISPATCH_METHOD'
        throw error
      }
    }
    catch(reason)
    {
      const error = new Error(`Invalid dispatcher for operation "${operation.operationId}"`)
      error.code  = 'E_OAS_INVALID_DISPATCHER'
      error.cause = reason
      throw error
    }

    operation.headers
    && this.headers.validateComponent(operation.headers)

    operation.parameters
    && this.parameters.validateComponent(operation.parameters)

    operation.requestBody
    && this.requestBodies.validateComponent(operation.requestBody)

    this.responses.validateComponent(operation.responses)
  }

  /**
   * Three dots # is used as a delimiter if a generic dispatcher is required,
   * else the operationId is used as the dispatcher name.
   * 
   * @param {string} operationId
   * @returns {string}
   */
  transformOperationIdToDispatcherName(operationId)
  {
    return String(operationId).split('#')[0]
  }
}