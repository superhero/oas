import ComponentsAbstraction from './abstraction.js'

/**
 * @memberof Oas.Components
 */
export default class Responses extends ComponentsAbstraction
{
  validComponentAttributes =
  [
    '$ref', 'description', 'headers', 'content', 'links'
  ]

  constructor(schemas, headers)
  {
    super()

    this.schemas = schemas
    this.headers = headers
  }

  /**
   * @param {object} component
   * @param {object} view
   */
  conform(component, view)
  {
    if(component.$ref)
    {
      return this.conformRef(component.$ref, view)
    }

    if('content' in component)
    {
      // TODO: implement support for other content-types
      // ...alter the view precenter to precent according to an accepted content-type
      // ...or fall back to first supported content-type by the component content
      const content = component.content['application/json']
      if(undefined === content)
      {
        const error = new Error(`The content attribute does not specify the only supported content-type "application/json"`)
        error.code  = 'E_OAS_UNSUPORTED_SPECIFICATION'
        error.cause = 'In the future a more flexilbe "content-type" support will be implemented, but for now is not supported'
        throw error
      }

      view.headers['content-type'] = 'application/json'

      if('schema' in content)
      {
        const
          oldBody = view.body,
          newBody = this.schemas.conform(content.schema, oldBody)

        view.body = null
        view.body = newBody
      }
    }

    if('headers' in component)
    {
      const 
        headers     = component.headers,
        headerType  = Object.prototype.toString.call(headers)

      if('[object Object]' !== headerType)
      {
        const error = new Error(`Invalid component attribute type ${headerType}`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        error.cause = new Error('The header attribute must be an [object Object]')
        throw error
      }

      for(const header in headers)
      {
        view.headers[header] = this.headers.conform(headers[header], view.headers[header])
      }
    }

    return view
  }

  validateRefPointer(pointer)
  {
    super.validateRefPointer(pointer)

    if(false === pointer.startsWith('/components/responses/'))
    {
      const error = new Error(`The ref pointer "${pointer}" must point to a responses component`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }
  }

  validateComponentRef(component)
  {
    for(const attribute in component)
    {
      super.validateComponentRef(component[attribute])
    }
  }

  validateComponentAttributes(component)
  {
    if(Object.keys(component).length === 0)
    {
      const error = new Error('The response component must have at least one status code attribute')
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }

    for(const attribute in component)
    {
      if(attribute < 100 
      || attribute > 599)
      {
        const error = new Error(`Invalid component attribute ${attribute}`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        throw error
      }
      else
      {
        this.validateStatusComponent(component[attribute])
      }
    }
  }

  validateStatusComponent(component)
  {
    super.validateComponentAttributes(component)
  }
}