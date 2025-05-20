import ComponentsAbstraction from './abstraction.js'

/**
 * @memberof Oas.Components
 */
export default class Parameters extends ComponentsAbstraction
{
  validParameterAttributes =
  [
    'name', 'in', 'required', 'description', 'deprecated', 
    'allowEmptyValue', 'schema', 'style', 'explode', 'examples', 
    'example', 'allowReserved', 'nullable', 'default', '$ref'
  ]

  constructor(specification, schemas)
  {
    super(specification)
    this.schemas = schemas
  }

  conform(component, request)
  {
    try
    {
      const value = this.getParameterValue(component, request)
      return request.param[component.name] = value ?? request.param[component.name]
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
      instance = this.schemas.conform(parameter.schema, instance, true)
    }

    if('default' in parameter
    && undefined === instance)
    {
      instance = parameter.default
    }

    if(parameter.nullable
    && null === instance)
    {
      return instance
    }

    if(undefined === instance
    &&(parameter.required || 'path' === parameter.in))
    {
      const error = new Error(`The parameter "${parameter.name}" is required`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      throw error
    }

    if(false === !!parameter.allowEmptyValue
    && ''    === instance)
    {
      const error = new Error(`The parameter ${parameter.name} is not allowed to be empty`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The parameter allowEmptyValue attribute is false and the parameter value is empty'
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

    if('query' !== parameter.in
    && 'allowEmptyValue' in parameter)
    {
      const error = new Error('The "allowEmptyValue" attribute is only valid for query parameters')
      error.code  = 'E_OAS_UNSUPORTED_SPECIFICATION'
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
