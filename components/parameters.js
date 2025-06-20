import ComponentsAbstraction from './abstraction.js'
import Schemas               from './schemas.js'

/**
 * @memberof Oas.Components
 */
export default class Parameters extends ComponentsAbstraction
{
  validParameterAttributes =
  [
    'name', 'in', 'required', 'description', 'deprecated', 
    'schema', 'style', 'explode', 'examples', 'example', 
    'allowReserved', 'nullable', 'default', '$ref'
  ]

  constructor(specification)
  {
    super(specification)
    this.schemas = new Schemas(specification)
  }

  conform(component, request)
  {
    try
    {
      const value = this.getParameterValue(component, request)
      return request.param[component.name] = value === undefined ? request.param[component.name] : value
    }
    catch(reason)
    {
      const error = new Error(`Invalid parameter "${component.name}" (${component.in})`)
      error.code  = 'E_OAS_INVALID_PARAMETER'
      error.cause = reason
      throw error
    }
  }

  getParameterValue(parameter, request)
  {
    if(parameter.$ref)
    {
      return this.conformRef(parameter.$ref, request)
    }

    let instance = this.extractValueFromRequest(parameter, request)

    if('schema' in parameter)
    {
      const schema = { ...parameter.schema }
      schema.nullable = schema.nullable || parameter.nullable
      instance = this.schemas.conform(schema, instance, true)
    }

    if(parameter.nullable
    && 'null' === String(instance).toLocaleLowerCase())
    {
      return null
    }

    if(undefined === instance
    &&(parameter.required || 'path' === parameter.in))
    {
      const error = new Error(`The parameter "${parameter.name}" is required`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      throw error
    }

    return instance
  }

  extractValueFromRequest(parameter, request)
  {
    switch(parameter.in)
    {
      case 'path'   : return parameter.explode
      ? request.param[parameter.name]?.split(',')
      : request.param[parameter.name]

      case 'query'  : return parameter.explode
      ? request.url.searchParams.getAll(parameter.name)
      : request.url.searchParams.get(parameter.name) ?? undefined

      case 'header' : return parameter.explode
      ? request.headers[parameter.name]?.split(',')
      : request.headers[parameter.name]
    }
  }

  validateRefPointer(pointer)
  {
    super.validateRefPointer(pointer)

    if(false === pointer.startsWith('/components/parameters/'))
    {
      const error = new Error(`The ref pointer "${pointer}" must point to a parameters component`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }
  }

  validateComponent(component)
  {
    const componentType = Object.prototype.toString.call(component)

    if('[object Array]' !== componentType)
    {
      const error = new Error(`Invalid component type ${componentType}`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The component type must be an [object Array]'
      throw error
    }

    for(const parameter of component)
    {
      this.validateParameterComponent(parameter)
    }
  }

  validateParameterComponent(parameter)
  {
    const parameterType = Object.prototype.toString.call(parameter)
  
    if('[object Object]' !== parameterType)
    {
      const error = new Error(`Invalid parameter type ${parameterType}`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The parameter type must be an [object Object]'
      throw error
    }

    this.validateComponentRef(parameter)

    if(parameter.$ref)
    {
      // The $ref attribute is the only 
      // attribute allowed when present.
      return
    }

    if(false === 'name' in parameter)
    {
      const error = new Error('The "name" attribute is required')
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }

    if(false === 'in' in parameter)
    {
      const error = new Error('The "in" attribute is required')
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }

    if(false === ['path', 'query', 'header', /*'cookie'*/].includes(parameter.in))
    {
      const error = new Error(`Invalid "in" attribute ${parameter.in}`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }

    if('allowReserved' in parameter)
    {
      const error = new Error('The "allowReserved" attribute is not supported in this implementation')
      error.code  = 'E_OAS_UNSUPORTED_SPECIFICATION'
      throw error
    }

    if('style' in parameter)
    {
      const error = new Error('The "style" attribute is not supported in this implementation')
      error.code  = 'E_OAS_UNSUPORTED_SPECIFICATION'
      throw error
    }
  }
}
