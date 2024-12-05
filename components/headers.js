import ComponentsAbstraction from './abstraction.js'

/**
 * @memberof Oas.Components
 */
export default class Headers extends ComponentsAbstraction
{
  validComponentAttributes =
  [
    'description', 'required', 'deprecated', 'schema', 
    'example', 'examples', '$ref'
  ]

  constructor(schemas)
  {
    super()
    this.schemas = schemas
  }

  conform(component, instance)
  {
    if(component.$ref)
    {
      return this.conformRef(component.$ref, instance)
    }
    
    if(component.required
    && undefined === instance)
    {
      const error = new Error(`Missing required header`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      throw error
    }

    if(undefined === instance)
    {
      return instance
    }

    if(false === !!component.allowEmptyValue
    && ''    === instance)
    {
      const error = new Error(`Header is not allowed to be empty`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      throw error
    }

    if('schema' in component)
    {
      const schema = component.schema
      return this.schemas.conform(schema, instance)
    }

    return instance
  }

  validateRefPointer(pointer)
  {
    super.validateRefPointer(pointer)

    if(false === pointer.startsWith('/components/headers/'))
    {
      const error = new Error(`The ref pointer "${pointer}" must point to a headers component`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }
  }

  validateComponentAttributes(component)
  {
    for(const header in component)
    {
      this.validateHeaderComponent(component[header])
    }
  }

  validateHeaderComponent(component)
  {
    super.validateComponentAttributes(component)
  }
}
