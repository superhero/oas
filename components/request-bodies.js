import ComponentsAbstraction from './abstraction.js'
import Schemas               from './schemas.js'

/**
 * @memberof Oas.Components
 */
export default class RequestBodies extends ComponentsAbstraction
{
  validComponentAttributes =
  [
    'description', 'required', 'content', '$ref'
  ]

  constructor(specification)
  {
    super(specification)
    this.schemas = new Schemas(specification)
  }

  denormalize(component)
  {
    const denormalized = super.denormalize(component)

    for(const contentType in denormalized.content)
    {
      if('schema' in denormalized.content[contentType])
      {
        denormalized.content[contentType].schema = this.schemas.denormalize(denormalized.content[contentType].schema)
      }
    }

    return denormalized
  }

  /**
   * @param {object} component
   * @param {object} request
   * 
   * @returns {*}
   * 
   * @throws {E_OAS_INVALID_SPECIFICATION}
   * @throws {E_OAS_UNSUPORTED_CONTENT_TYPE}
   */
  conform(component, request)
  {
    try
    {
      if(component.$ref)
      {
        return this.conformRef(component.$ref, request)
      }

      const requestContentType = request.headers['content-type']?.split(';')[0].split('*')[0] || ''
  
      for(const contentType in component.content)
      {
        // supports a wildcard content type, if precent, else as normal
        const supportedContentType = contentType.split('*')[0]
  
        if(supportedContentType.startsWith(requestContentType)
        || requestContentType.startsWith(supportedContentType))
        {
          if('schema' in component.content[contentType])
          {
            return request.body = this.schemas.conform(component.content[contentType].schema, request.body, true)
          }
          else
          {
            const error = new Error(`Missing the required schema attribute in the request body: "${contentType}"`)
            error.code  = 'E_OAS_INVALID_SPECIFICATION'
            throw error
          }
        }
      }

      const error = new Error(`The provided content-type "${request.headers['content-type']}" is not supported`)
      error.code  = 'E_OAS_UNSUPORTED_CONTENT_TYPE'
      throw error
    }
    catch(reason)
    {
      const error = new Error(`Invalid request body`)
      error.code  = 'E_OAS_INVALID_REQUEST_BODY'
      error.cause = reason
      throw error
    }
  }

  validateRefPointer(pointer)
  {
    super.validateRefPointer(pointer)

    if(false === pointer.startsWith('/components/requestBodies/'))
    {
      const error = new Error(`The ref pointer "${pointer}" must point to a requestBodies component`)
      error.code  = 'E_OAS_INVALID_REQUEST_BODIES_SPECIFICATION'
      throw error
    }
  }

  validateComponent(component)
  {
    super.validateComponent(component)

    if(component.$ref)
    {
      // The $ref attribute is the only attribute allowed when present
      return
    }

    const type = Object.prototype.toString.call(component.content)

    if('[object Object]' !== type)
    {
      const error = new TypeError(`The operation is required to define a "content" attribute in the requestBody of the type object`)
      error.code  = 'E_OAS_INVALID_REQUEST_BODIES_SPECIFICATION'
      error.cause = `The "content" attribute in the requestBody is of type: ${type}`
      throw error
    }

    if(false === !!component.content['application/json'])
    {
      const error = new TypeError(`The operation only supports a defined "application/json" content type in the requestBody`)
      error.code  = 'E_OAS_UNSUPORTED_REQUEST_BODIES_SPECIFICATION'
      throw error
    }

    if(Object.keys(component.content).length > 1)
    {
      const error = new TypeError(`The operation defines unsupported content type in the operation`)
      error.code  = 'E_OAS_UNSUPORTED_REQUEST_BODIES_SPECIFICATION'
      error.cause = `The implementation currently only supports the "application/json" content type`
      throw error
    }
  }
}
