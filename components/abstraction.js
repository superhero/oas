import assert from 'node:assert'

/**
 * An abstract class that provides common functionality for
 * OpenAPI Specification components.
 * 
 * @abstract
 * @memberof Oas
 */
export default class ComponentsAbstraction
{
  constructor(specification)
  {
    this.specification = specification
  }

  listFormat = new Intl.ListFormat('en', { style:'long', type:'disjunction' })

  deepEqual = assert.deepEqual

  validComponentAttributes = []

  conformRef(ref, instance, ...args)
  {
    if('string' === typeof ref)
    {
      const [ uri, pointer ] = ref.split('#')

      this.validateRefUri(uri)
      this.validateRefPointer(pointer)

      const [ root, ...segments ] = pointer.split('/')

      this.validateRefRoot(root)

      const component = this.locateComponentByRef(uri, segments)

      return this.conform(component, instance, ...args)
    }
    else
    {
      const error = new TypeError(`Invalid ref type ${Object.prototype.toString.call(ref)}`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The ref type must be a string'
      throw error
    }
  }

  locateComponentByRef(uri, path)
  {
    try
    {
      const component = path
        .map(this.decodeJsonPointer)
        .reduce((spec, pointer) => spec[pointer], this.specification)

      if(component)
      {
        return component
      }
      else
      {
        const error = new Error(`The ref pointer path is empty`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        throw error
      }
    }
    catch(reason)
    {
      const error = new TypeError(`Invalid ref pointer path "${path}"`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = reason
      throw error
    }
  }

  // RFC 6901. Section 4. Pointer Evaluation
  decodeJsonPointer(segment)
  {
    return segment.replace(/~1/g, '/').replace(/~0/g, '~')
  }

  validateRefUri(uri)
  {
    if(true === !!uri)
    {
      const error = new TypeError(`Invalid ref uri "${uri}"`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'Only local references are supported'
      throw error
    }
  }

  validateRefPointer(pointer)
  {
    if(false === !!pointer)
    {
      const error = new TypeError(`The ref pointer is missing`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The ref must include a # symbol'
      throw error
    }
  }

  validateRefRoot(root)
  {
    if(true === !!root)
    {
      const error = new TypeError(`Invalid ref pointer`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The ref pointer must be an absolute path'
      throw error
    }
  }

  validateComponent(component)
  {
    const componentType = Object.prototype.toString.call(component)

    if('[object Object]' !== componentType)
    {
      const error = new Error(`Invalid component type ${componentType}`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The component type must be an [object Object]'
      throw error
    }

    this.validateComponentAttributes(component)
    this.validateComponentRef(component)
  }

  validateComponentRef(component)
  {
    if('$ref' in component)
    {
      if(Object.keys(component).length > 1)
      {
        const error = new Error('The component must only have the "$ref" attribute when defined')
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        throw error
      }
    }
  }

  validateComponentAttributes(component)
  {
    for(const attribute in component)
    {
      if(false === this.validComponentAttributes.includes(attribute))
      {
        const error = new Error(`Invalid component attribute "${attribute}"`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        error.cause = `Valid attributes: ${this.listFormat.format(this.validComponentAttributes)}`
        throw error
      }
    }
  }
}