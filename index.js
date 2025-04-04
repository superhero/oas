import Headers        from '@superhero/oas/components/headers'
import Parameters     from '@superhero/oas/components/parameters'
import RequestBodies  from '@superhero/oas/components/request-bodies'
import Responses      from '@superhero/oas/components/responses'
import Schemas        from '@superhero/oas/components/schemas'

export function locate(locator)
{
  const router = locator('@superhero/http-server').router
  return new OAS(router)
}

export default class OAS
{
  constructor(router)
  {
    this.router = router

    this.schemas        = new Schemas()
    this.headers        = new Headers(this.schemas)
    this.parameters     = new Parameters(this.schemas)
    this.requestBodies  = new RequestBodies(this.schemas)
    this.responses      = new Responses(this.schemas, this.headers)
  }

  bootstrap(specification)
  {
    this.setSpecification(this.router, specification)
  }

  setSpecification(router, specification)
  {
    this.schemas.specification        = specification
    this.headers.specification        = specification
    this.parameters.specification     = specification
    this.requestBodies.specification  = specification
    this.responses.specification      = specification

    this.validatePaths(specification?.paths)

    for(const path in specification.paths)
    {
      const route = this.createRoute(specification.paths[path])
      route.criteria = path.replace(/\{([^}]+)\}/g, ':$1'),
      router.set('oas/paths/~' + path, route)
    }
  }

  validatePaths(paths)
  {
    const pathsType = Object.prototype.toString.call(paths)

    if('[object Object]' !== pathsType)
    {
      const error = new Error('The paths property in the specification must be an object')
      error.code = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = new Error(`The paths property in the specification is of invalid type ${pathsType}`)
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
      this.validateOperation(operation)
      method = method.toLowerCase()
      route['method.' + method] = this.transformOperationIdToDispatcherName(operation.operationId)
      oas[method.toUpperCase()] = operation
    }

    Object.defineProperty(route, 'oas', { value: oas })

    const
      contentTypeDispatcherPrefix = '@superhero/http-server/dispatcher/upstream/header/content-type/',
      contentType = 'application/json'

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
      const error = new TypeError(`The operation does not define an operationId`)
      error.code  = 'E_OAS_UNSUPORTED_SPECIFICATION'
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
      const error = new Error(`The operationId "${operation.operationId}" does not point to an availible dispatcher`)
      error.code  = 'E_OAS_DISPATCHER_NOT_AVAILIBLE'
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