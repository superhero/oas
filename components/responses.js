import ComponentsAbstraction from './abstraction.js'
import Schemas               from './schemas.js'
import Headers               from './headers.js'

/**
 * @memberof Oas.Components
 */
export default class Responses extends ComponentsAbstraction
{
  validComponentAttributes =
  [
    '$ref', 'description', 'headers', 'content', 'links'
  ]

  constructor(specification)
  {
    super(specification)
    this.schemas = new Schemas(specification)
    this.headers = new Headers(specification)
  }

  denormalize(component)
  {
    const denormalized = super.denormalize(component)

    if('content' in component)
    {
      for(const contentType in denormalized.content)
      {
        if('schema' in denormalized.content[contentType])
        {
          denormalized.content[contentType].schema = this.schemas.denormalize(denormalized.content[contentType].schema)
        }
      }
    }

    return denormalized
  }

  /**
   * @param {object} component
   * @param {object} view
   */
  conform(component, view)
  {
    try
    {
      if(component.$ref)
      {
        return this.conformRef(component.$ref, view)
      }

      if('content' in component)
      {
        // TODO: implement support for other content-types
        // ...alter the view presenter to present according to an accepted content-type
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

          // The view body is using a setter that extends the previous 
          // object with the new object body, if not first cleared by 
          // setting the view body to null.
          view.body = null
          view.body = newBody
        }
      }
  
      // Optional headers returned with the response.
      if('headers' in component)
      {
        const 
          headers     = component.headers,
          headerType  = Object.prototype.toString.call(headers)
  
        if('[object Object]' !== headerType)
        {
          const error = new Error(`Invalid component attribute type: ${headerType}`)
          error.code  = 'E_OAS_INVALID_SPECIFICATION'
          error.cause = 'The header attribute must be of type: [object Object]'
          throw error
        }

        for(const header in headers)
        {
          try
          {
            view.headers[header] = this.headers.conform(headers[header], view.headers[header])
          }
          catch(reason)
          {
            const error = new Error(`Invalid header "${header}"`)
            error.code  = 'E_OAS_RESPONSE_INVALID_HEADER'
            error.cause = reason
            throw error
          }
        }
      }
  
      return view
    }
    catch(reason)
    {
      const error = new Error(`Invalid response`)
      error.code  = 'E_OAS_INVALID_RESPONSE'
      error.cause = reason
      throw error
    }
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
}