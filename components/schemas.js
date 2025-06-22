import deepmerge              from '@superhero/deep/merge'
import deepclone              from '@superhero/deep/clone'
import net                    from 'node:net'
import ComponentsAbstraction  from './abstraction.js'

/**
 * @memberof Oas.Components
 */
export default class Schemas extends ComponentsAbstraction
{
  validComponentAttributes =
  [
    'title', 'description', 'type', 'default', 'deprecated', 'example', 'examples', 
    'nullable', 'readOnly', 'writeOnly', 'externalDocs', 'minLength', 'maxLength', 
    'pattern', 'format', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 
    'multipleOf', 'items', 'minItems', 'maxItems', 'uniqueItems', 'prefixItems', 
    'properties', 'required', 'additionalProperties', 'minProperties', 'maxProperties', 
    'propertyNames', 'allOf', 'oneOf', 'anyOf', 'not', 'const', 'enum',
    'if', 'then', 'else', '$ref'
  ]

  validateNumberFormat = new Map
  validateStringFormat = new Map

  constructor(specification)
  {
    super(specification)

    this.validateNumberFormat.set('float',      this.validateNumberFormatFloat)
    this.validateNumberFormat.set('double',     this.validateNumberFormatDouble)
    this.validateNumberFormat.set('int32',      this.validateNumberFormatInt32)
    this.validateNumberFormat.set('int64',      this.validateNumberFormatInt64)

    this.validateStringFormat.set('date',       this.validateStringFormatDate)
    this.validateStringFormat.set('time',       this.validateStringFormatTime)
    this.validateStringFormat.set('datetime',   this.validateStringFormatDatetime)
    this.validateStringFormat.set('date-time',  this.validateStringFormatDatetime)
    this.validateStringFormat.set('base64',     this.validateStringFormatBase64)
    this.validateStringFormat.set('byte',       this.validateStringFormatBase64)
    this.validateStringFormat.set('email',      this.validateStringFormatEmail)
    this.validateStringFormat.set('ipv4',       this.validateStringFormatIpv4)
    this.validateStringFormat.set('ipv6',       this.validateStringFormatIpv6)
    this.validateStringFormat.set('url',        this.validateStringFormatUrl)
    this.validateStringFormat.set('uuid',       this.validateStringFormatUuid)
  }

  denormalize(component)
  {
    const denormalized = super.denormalize(component)

    if('properties' in component)
    {
      for(const property in denormalized.properties)
      {
        if('schema' in denormalized.properties[property])
        {
          denormalized.properties[property] = this.denormalize(denormalized.properties[property])
        }
      }
    }

    const denormalize = this.denormalize.bind(this)

    for(const key of [ 'items', 'prefixItems', 'additionalProperties', 'allOf', 'oneOf', 'anyOf' ])
    {
      if(key in denormalized)
      {
        denormalized[key] = [ denormalized[key] ].flat().map(denormalize)
      }
    }

    for(const key of [ 'if', 'then', 'else', 'not' ])
    {
      if(key in denormalized)
      {
        denormalized[key] = this.denormalize(denormalized[key])
      }
    }

    return denormalized
  }

  conform(component, instance, isWriting)
  {
    try
    {
      if(component.$ref)
      {
        return this.conformRef(component.$ref, instance, isWriting)
      }

      if('readOnly' in component
      && true === !!isWriting)
      {
        return
      }

      if('writeOnly' in component
      && false === !!isWriting)
      {
        return
      }

      instance = this.conformDefault(component, instance)
      instance = this.conformIfThenElse(component, instance, isWriting)
      instance = this.conformAllOf(component, instance, isWriting)
      instance = this.conformAnyOf(component, instance, isWriting)
      instance = this.conformOneOf(component, instance, isWriting)

      if(component.nullable
      && 'null' === String(instance).toLocaleLowerCase())
      {
        return null
      }

      const instanceType = Object.prototype.toString.call(instance)

      if('[object Null]'      !== instanceType
      && '[object Undefined]' !== instanceType)
      {
        switch(component.type)
        {
          case 'array':
          {
            instance = this.conformTypeArray(component, instance, instanceType, isWriting)
            break
          }
          case 'boolean':
          {
            instance = this.conformTypeBoolean(instance, instanceType)
            break
          }
          case 'integer':
          case 'number':
          {
            instance = this.conformTypeNumber(component, instance, instanceType)
            break
          }
          case 'object':
          {
            instance = this.conformTypeObject(component, instance, instanceType, isWriting)
            break
          }
          case 'string':
          {
            instance = this.conformTypeString(component, instance, instanceType)
            break
          }
          case 'null':
          {
            instance = this.conformTypeNull(component, instance, instanceType)
            break
          }
          case undefined:
          {
            break
          }
          default:
          {
            const error = new Error(`Invalid component type ${component.type}`)
            error.code  = 'E_OAS_INVALID_SPECIFICATION'
            throw error
          }
        }
      }

      if('null' === String(instance).toLocaleLowerCase() 
      && true   !== component.nullable 
      && 'null' !== component.type)
      {
        const error = new Error(`Invalid instance`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = 'The instance must NOT be null'
        throw error
      }

      this.validateNot(component, instance, isWriting)
      this.validateConst(component, instance)
      this.validateEnum(component, instance)

      return instance
    }
    catch(reason)
    {
      const error = new Error(`Invalid schema`)
      error.code  = 'E_OAS_INVALID_SCHEMA'
      error.cause = reason
      throw error
    }
  }

  conformDefault(component, instance)
  {
    if('default' in component)
    {
      if(undefined === instance)
      {
        instance = deepclone(component.default)
      }
    }

    return instance
  }

  conformIfThenElse(component, instance, isWriting)
  {
    if('if' in component)
    {
      if('then' in component
      || 'else' in component)
      {
        try
        {
          this.conform(component.if, instance, isWriting)
  
          if('then' in component)
          {
            instance = this.conform(component.then, instance, isWriting)
          }
        }
        catch(error)
        {
          if('else' in component)
          {
            instance = this.conform(component.else, instance, isWriting)
          }
        }
      }
    }

    return instance
  }

  conformAllOf(component, instance, isWriting)
  {
    if('allOf' in component)
    {
      const instances = []

      for(const allOfComponent of component.allOf)
      {
        instances.push(this.conform(allOfComponent, instance, isWriting))
      }

      instance = deepmerge(...instances)
    }

    return instance
  }

  conformAnyOf(component, instance, isWriting)
  {
    if('anyOf' in component)
    {
      let errors = 0

      for(const anyOfComponent of component.anyOf)
      {
        try
        {
          instance = this.conform(anyOfComponent, instance, isWriting)
          break
        }
        catch(error)
        {
          errors++
        }
      }

      if(errors === component.anyOf.length)
      {
        const error = new Error(`Invalid instance`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = 'The instance must match at least one of the "anyOf" specifiations'
        throw error
      }
    }

    return instance
  }

  conformOneOf(component, instance, isWriting)
  {
    if('oneOf' in component)
    {
      let errors = 0

      for(const oneOfComponent of component.oneOf)
      {
        try
        {
          instance = this.conform(oneOfComponent, instance, isWriting)
        }
        catch(error)
        {
          errors++
        }
      }

      if(errors !== component.oneOf.length - 1)
      {
        const error = new Error(`Invalid instance`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = 'The instance must match exactly one of the "oneOf" specifiations'
        throw error
      }
    }

    return instance
  }

  conformTypeArray(component, instance, instanceType, isWriting)
  {
    this.validateTypeArrayInstanceType(instanceType)

    instance = this.conformTypeArrayItems(component, instance, isWriting)
    
    this.validateTypeArrayMinItems(component, instance)
    this.validateTypeArrayMaxItems(component, instance)
    instance = this.validateTypeArrayUniqueItems(component, instance)

    return instance
  }

  // Attempting to support both 3.0 and 3.1 OAS tuple validation
  conformTypeArrayItems(component, instance, isWriting)
  {
    if(false === !!component.items)
    {
      const error = new Error(`Invalid "array" schema component`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The schema type: "array" must have an "items" attribute'
      throw error
    }

    if(Array.isArray(component.items) && component.items.length === 0)
    {
      const error = new Error(`Invalid "array" schema component`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The schema type: "array" must have an "items" attribute with at least one item'
      throw error
    }

    const 
      items   = [ component.items ].flat(),
      output  = [],
      conform = (itemComponent, itemInstance) =>
      {
        const conformed = this.conform(itemComponent, itemInstance, isWriting)

        if(conformed    !== undefined
        || itemInstance === undefined)
        {
          output.push(conformed)
        }
      }

    let i = 0

    if(component.prefixItems)
    {
      const prefixItems = [ component.prefixItems ].flat()

      for(; i < instance.length && i < prefixItems.length; i++)
      {
        conform(prefixItems[i], instance[i])
      }
    }

    for(let n = 0; i < instance.length; i++, n++)
    {
      conform(items[n % items.length], instance[i])
    }

    return output
  }

  conformTypeBoolean(instance, instanceType)
  {
    if('[object Boolean]' !== instanceType)
    {
      switch(String(instance).toLowerCase().trim())
      {
        case 'true':
        case 'on':
        case 'yes':
        case '1':
        {
          instance = true
          break
        }
        case 'false':
        case 'off':
        case 'no':
        case '0':
        {
          instance = false
          break
        }
        default:
        {
          const error = new Error(`Invalid boolean instance type ${instanceType}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          throw error
        }
      }
    }

    return instance
  }

  conformTypeNumber(component, instance, instanceType)
  {
    instance = this.transformTypeNumber(instance, instanceType)

    this.validateTypeNumberInstanceType(component, instance)
    this.validateTypeNumberInteger(component, instance)
    this.validateTypeNumberMinimum(component, instance)
    this.validateTypeNumberMaximum(component, instance)
    this.validateTypeNumberMultipleOf(component, instance)
    this.validateTypeNumberFormat(component, instance)

    return instance
  }

  transformTypeNumber(instance, instanceType)
  {
    switch(instanceType)
    {
      case '[object String]' : return Number(instance)
      case '[object Date]'   : return instance.getTime()
      default                : return instance
    }
  }

  conformTypeObject(component, instance, instanceType, isWriting)
  {
    this.validateTypeObjectInstanceType(instanceType)

    instance = this.conformTypeObjectProperties(component, instance, isWriting)

    this.validateTypeObjectRequired(component, instance)
    this.validateTypeObjectAdditionalProperties(component, instance)
    this.validateTypeObjectMinProperties(component, instance)
    this.validateTypeObjectMaxProperties(component, instance)
    this.validateTypeObjectPropertyNames(component, instance)

    return instance
  }

  conformTypeObjectProperties(component, instance, isWriting)
  {
    const output = deepclone(instance)

    if('properties' in component)
    {
      const errors = []

      for(const name in component.properties)
      {
        try
        {
          output[name] = this.conform(component.properties[name], output[name], isWriting)
          if(undefined === output[name])
          {
            delete output[name]
          }
        }
        catch(reason)
        {
          const error = new Error(`Invalid property "${name}"`)
          error.code  = 'E_OAS_INVALID_PROPERTY'
          error.cause = reason
          errors.push(error)
        }
      }

      if(errors.length)
      {
        const error = new Error(`Invalid properties`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = errors
        throw error
      }
    }

    return output
  }

  conformTypeString(component, instance, instanceType)
  {
    this.validateTypeStringInstanceType(instanceType)
    this.validateTypeStringMinLength(component, instance)
    this.validateTypeStringMaxLength(component, instance)
    this.validateTypeStringPattern(component, instance)
    this.validateTypeStringFormat(component, instance)

    return instance
  }

  conformTypeNull(component, instance, instanceType)
  {
    if(null !== instance)
    {
      switch(String(instance).toLowerCase().trim())
      {
        case 'null':
        case '':
        {
          instance = null
          break
        }
        default:
        {
          const error = new Error(`Invalid null instance type ${instanceType}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          error.cause = 'The instance value must be null'
          throw error
        }
      }
    }

    return instance
  }

  validateRefPointer(pointer)
  {
    super.validateRefPointer(pointer)

    if(false === pointer.startsWith('/components/schemas/'))
    {
      const error = new Error(`The ref pointer "#${pointer}" must point to a schema component`)
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      throw error
    }
  }

  validateComponent(component)
  {
    super.validateComponent(component)

    const invalidAttributes = []

    switch(component.type)
    {
      case 'array':
      {
        this.validateComponentArray(component, invalidAttributes)
        break
      }
      case 'boolean':
      {
        this.validateComponentBoolean(component, invalidAttributes)
        break
      }
      case 'integer':
      case 'number':
      {
        this.validateComponentNumber(component, invalidAttributes)
        break
      }
      case 'string':
      {
        this.validateComponentString(component, invalidAttributes)
        break
      }
      case 'object':
      {
        this.validateComponentObject(component, invalidAttributes)
        break
      }
      case 'null':
      {
        this.validateComponentNull(component, invalidAttributes)
        break
      }
      case undefined:
      {
        break
      }
      default:
      {
        const error = new Error(`Invalid component type ${component.type}`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        throw error
      }
    }

    for(const invalidAttribute of invalidAttributes)
    {
      if(invalidAttribute in component)
      {
        const error = new Error(`Invalid attribute "${invalidAttribute}" for type ${component.type}`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        throw error
      }
    }
  }

  validateComponentArray(component, invalidAttributes)
  {
    if('enum' in component)
    {
      for(const item of component.enum)
      {
        if(null === item && component.nullable)
        {
          continue
        }

        if(false === Array.isArray(item))
        {
          const error = new Error('Invalid component enum')
          error.code  = 'E_OAS_INVALID_SPECIFICATION'
          error.cause = 'The component enum must be an array of arrays'
          throw error
        }
      }
    }

    if(false === !!component.prefixItems
    && false === !!component.items)
    {
      const error = new Error('Invalid component array')
      error.code  = 'E_OAS_INVALID_SPECIFICATION'
      error.cause = 'The component array must have an "items" attribute'
      throw error
    }

    invalidAttributes.push( 
      'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'format', 'properties', 
      'minProperties', 'maxProperties', 'additionalProperties', 'required', 
      'propertyNames', 'multipleOf')
  }

  validateComponentBoolean(component, invalidAttributes)
  {
    if('enum' in component)
    {
      for(const item of component.enum)
      {
        if('boolean' !== typeof item)
        {
          if(null === item && component.nullable)
          {
            continue
          }

          const error = new Error('Invalid component enum')
          error.code  = 'E_OAS_INVALID_SPECIFICATION'
          error.cause = 'The component enum must be an array of booleans'
          throw error
        }
      }
    }

    invalidAttributes.push( 
      'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'format', 'properties', 
      'minProperties', 'items', 'minItems', 'maxProperties', 'additionalProperties', 
      'maxItems', 'required', 'uniqueItems', 'propertyNames', 'multipleOf')
  }

  validateComponentNumber(component, invalidAttributes)
  {
    if('enum' in component)
    {
      for(const item of component.enum)
      {
        if('number' !== typeof item)
        {
          if(null === item && component.nullable)
          {
            continue
          }

          const error = new Error('Invalid component enum')
          error.code  = 'E_OAS_INVALID_SPECIFICATION'
          error.cause = 'The component enum must be an array of numbers'
          throw error
        }
      }
    }

    invalidAttributes.push( 
      'items', 'properties', 'minItems', 'maxItems', 'minLength', 'maxLength', 
      'pattern', 'minProperties', 'maxProperties', 'additionalProperties', 'required', 
      'uniqueItems', 'propertyNames')
  }

  validateComponentString(component, invalidAttributes)
  {
    if('enum' in component)
    {
      for(const item of component.enum)
      {
        if('string' !== typeof item)
        {
          if(null === item && component.nullable)
          {
            continue
          }

          const error = new Error('Invalid component enum')
          error.code  = 'E_OAS_INVALID_SPECIFICATION'
          error.cause = 'The component enum must be an array of strings'
          throw error
        }
      }
    }

    invalidAttributes.push(
      'items', 'minimum', 'maximum', 'properties', 'minItems', 'maxItems', 'minProperties', 
      'maxProperties', 'propertyNames', 'additionalProperties', 'required', 'uniqueItems', 
      'multipleOf')
  }

  validateComponentObject(component, invalidAttributes)
  {
    if('enum' in component)
    {
      for(const item of component.enum)
      {
        if('[object Object]' !== Object.prototype.toString.call(item))
        {
          if(null === item && component.nullable)
          {
            continue
          }

          const error = new Error('Invalid component enum')
          error.code  = 'E_OAS_INVALID_SPECIFICATION'
          error.cause = 'The component enum must be an array of objects'
          throw error
        }
      }
    }

    invalidAttributes.push( 
      'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'items', 'minItems', 
      'maxItems', 'uniqueItems', 'multipleOf')
  }

  validateComponentNull(component, invalidAttributes)
  {
    invalidAttributes.push( 
      'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'items', 'properties', 
      'minItems', 'maxItems', 'minProperties', 'maxProperties', 'propertyNames', 
      'additionalProperties', 'required', 'uniqueItems', 'multipleOf', 'format')
  }

  validateTypeArrayInstanceType(instanceType)
  {
    if('[object Array]' !== instanceType)
    {
      const error = new Error(`Invalid array instance type ${instanceType}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      throw error
    }
  }

  validateTypeArrayMinItems(component, instance)
  {
    if('minItems' in component)
    {
      if(instance.length < component.minItems)
      {
        const error = new Error(`Invalid amount of array items ${instance.length}`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = `The array must have at least ${component.minItems} items`
        throw error
      }
    }
  }

  validateTypeArrayMaxItems(component, instance)
  {
    if('maxItems' in component)
    {
      if(instance.length > component.maxItems)
      {
        const error = new Error(`Invalid amount of array items ${instance.length}`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = `The array can not have more than ${component.maxItems} items`
        throw error
      }
    }
  }

  validateTypeArrayUniqueItems(component, instance)
  {
    if(component.uniqueItems)
    {
      const uniqueItems = []

      next : for(let i = 0; i < instance.length; i++)
      {
        for(let n = i + 1; n < instance.length; n++)
        {
          try
          {
            this.deepEqual(instance[i], instance[n])
            continue next // not unique, so continue to next 
          }
          catch(error)
          {
            continue
          }
        }

        // If we reach this point, then 
        // the item is unique.
        uniqueItems.push(instance[i])
      }
      
      instance = uniqueItems
    }

    return instance
  }

  validateTypeNumberInstanceType(component, instance)
  {
    if(false === Number.isFinite(instance))
    {
      const error = new Error(`Invalid ${component.type} instance`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = `The instance: "${instance}" is not a valid ${component.type}`
      throw error
    }
  }

  validateTypeNumberInteger(component, instance)
  {
    if('integer'  === component.type
    && false      === Number.isInteger(instance))
    {
      const error = new Error(`Invalid ${component.type} insance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = `The ${component.type} is not an integer`
      throw error
    }
  }

  validateTypeNumberMinimum(component, instance)
  {
    if('minimum' in component)
    {
      if(component.exclusiveMinimum)
      {
        if(instance <= component.minimum)
        {
          const error = new Error(`Invalid ${component.type} instance ${instance}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          error.cause = `The ${component.type} must be greater than ${component.minimum}`
          throw error
        }
      }
      else
      {
        if(instance < component.minimum)
        {
          const error = new Error(`Invalid ${component.type} instance ${instance}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          error.cause = `The ${component.type} must be greater than or equal to ${component.minimum}`
          throw error
        }
      }
    }
  }

  validateTypeNumberMaximum(component, instance)
  {
    if('maximum' in component)
    {
      if(component.exclusiveMaximum)
      {
        if(instance >= component.maximum)
        {
          const error = new Error(`Invalid ${component.type} instance ${instance}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          error.cause = `The ${component.type} must be less than ${component.maximum}`
          throw error
        }
      }
      else
      {
        if(instance > component.maximum)
        {
          const error = new Error(`Invalid ${component.type} instance ${instance}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          error.cause = `The ${component.type} must be less than or equal to ${component.maximum}`
          throw error
        }
      }
    }
  }

  validateTypeNumberMultipleOf(component, instance)
  {
    if('multipleOf' in component)
    {
      if(instance % component.multipleOf)
      {
        const error = new Error(`Invalid ${component.type} instance ${instance}`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = `The ${component.type} must be a multiple of ${component.multipleOf}`
        throw error
      }
    }
  }

  validateTypeNumberFormat(component, instance)
  {
    if('format' in component)
    {
      if(false === this.validateNumberFormat.has(component.format))
      {
        const error = new Error(`Invalid format ${component.format}`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        error.cause = 'The provided format is unknown'
        throw error
      }

      const validateNumberFormat = this.validateNumberFormat.get(component.format)
      validateNumberFormat(instance)
    }
  }

  validateNumberFormatFloat(instance)
  {
    // no validation required imo
  }

  validateNumberFormatDouble(instance)
  {
    // no validation required imo
  }

  validateNumberFormatInt32(instance)
  {
    if(instance < -2147483648 
    || instance >  2147483647)
    {
      const error = new Error(`Invalid int32 format ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The int32 instance must be between -2147483648 and 2147483647'
      throw error
    }
  }

  validateNumberFormatInt64(instance)
  {
    if(instance < -9007199254740991
    || instance >  9007199254740991)
    {
      const error = new Error(`Invalid int64 format ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The int64 instance must be between -9007199254740991 and 9007199254740991'
      throw error
    }
  }

  validateTypeObjectInstanceType(instanceType)
  {
    if('[object Object]' !== instanceType)
    {
      const error = new Error(`Invalid object instance type ${instanceType}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      throw error
    }
  }

  validateTypeObjectRequired(component, instance)
  {
    if('required' in component)
    {
      const missing = []

      for(const name of component.required)
      {
        if(undefined === instance[name])
        {
          missing.push(name)
        }
      }

      if(missing.length)
      {
        const error = new Error(`Missing required properties`)
        error.code  = 'E_OAS_SCHEMA_OBJECT_MISSING_REQUIRED_PROPERTIES'
        error.cause = `The object must have ${missing.length === 1 ? 'property' : 'properties'} ${this.listFormat.format(missing)}`
        throw error
      }
    }
  }

  validateTypeObjectAdditionalProperties(component, instance)
  {
    if(false === component.additionalProperties)
    {
      const properties = new Set(Object.keys(component.properties ?? {}))

      for(const name in instance)
      {
        if(false === properties.has(name))
        {
          delete instance[name]
        }
      }
    }
  }

  validateTypeObjectMinProperties(component, instance)
  {
    if('minProperties' in component)
    {
      if(Object.keys(instance).length < component.minProperties)
      {
        const error = new Error(`Invalid amount of properties in object instance`)
        error.code  = 'E_OAS_SCHEMA_OBJECT_MIN_PROPERTIES'
        error.cause = `The object must have at least ${component.minProperties} properties`
        throw error
      }
    }
  }

  validateTypeObjectMaxProperties(component, instance)
  {
    if('maxProperties' in component)
    {
      if(Object.keys(instance).length > component.maxProperties)
      {
        const error = new Error(`Invalid amount of object instance properties`)
        error.code  = 'E_OAS_SCHEMA_OBJECT_MIN_PROPERTIES'
        error.cause = `The object can not have more than ${component.maxProperties} properties`
        throw error
      }
    }
  }

  validateTypeObjectPropertyNames(component, instance)
  {
    if('propertyNames' in component)
    {
      let regexp

      if('pattern' in component.propertyNames)
      {
        try
        {
          regexp = new RegExp(component.propertyNames.pattern)
        }
        catch(reason)
        {
          const error = new Error(`Invalid regexp pattern ${component.propertyNames.pattern}`)
          error.code  = 'E_OAS_SCHEMA_OBJECT_PROPERTY_NAMES_INVALID_REGEXP'
          error.cause = reason
          throw error
        }

        for(const name in instance)
        {
          if(false === regexp.test(name))
          {
            const error = new Error(`Invalid object property name ${name}`)
            error.code  = 'E_OAS_SCHEMA_OBJECT_PROPERTY_NAMES_INVALID_NAME'
            error.cause = `The object property name "${name}" must match the pattern ${component.propertyNames.pattern}`
            throw error
          }
        }
      }
      else
      {
        const error = new Error(`Invalid "propertyNames" attribute in object component`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        error.cause = 'The "propertyNames" attribute in the schema object component must define a "pattern" attribute'
        throw error
      }
    }
  }

  validateTypeStringInstanceType(instanceType)
  {
    if('[object String]' !== instanceType)
    {
      const error = new Error(`Invalid string instance type ${instanceType}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      throw error
    }
  }

  validateTypeStringMinLength(component, instance)
  {
    if('minLength' in component)
    {
      if(instance.length < component.minLength)
      {
        const error = new Error(`Invalid string instance length ${instance.length}`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = `The string must have at least ${component.minLength} characters`
        throw error
      }
    }
  }

  validateTypeStringMaxLength(component, instance)
  {
    if('maxLength' in component)
    {
      if(instance.length > component.maxLength)
      {
        const error = new Error(`Invalid string instance length ${instance.length}`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = `The string can not have more than ${component.maxLength} characters`
        throw error
      }
    }
  }

  validateTypeStringPattern(component, instance)
  {
    if('pattern' in component)
    {
      let regexp

      try
      {
        regexp = new RegExp(component.pattern)
      }
      catch(reason)
      {
        const error = new Error(`Invalid regexp pattern ${component.pattern}`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        error.cause = reason
        throw error
      }

      if(false === regexp.test(instance))
      {
        const error = new Error(`Invalid string instance ${instance}`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = `The string must match the pattern ${component.pattern}`
        throw error
      }
    }
  }

  validateTypeStringFormat(component, instance)
  {
    if('format' in component)
    {
      if(false === this.validateStringFormat.has(component.format))
      {
        const error = new Error(`Invalid format ${component.format}`)
        error.code  = 'E_OAS_INVALID_SPECIFICATION'
        error.cause = 'The provided format is unknown'
        throw error
      }

      const validateStringFormat = this.validateStringFormat.get(component.format)
      validateStringFormat(instance)
    }
  }

  validateNot(component, instance, isWriting)
  {
    if('not' in component)
    {
      let valid = false

      try
      {
        this.conform(component.not, instance, isWriting)
      }
      catch(error)
      {
        valid = true
      }

      if(false === valid)
      {
        const error = new Error(`Invalid instance`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = 'The instance must not match the "not" specifiations'
        throw error
      }
    }
  }

  validateConst(component, instance)
  {
    if('const' in component)
    {
      try
      {
        this.deepEqual(instance, component.const)
      }
      catch(reason)
      {
        const error = new Error(`Invalid instance ${instance}`)
        error.code  = 'E_OAS_INVALID_INSTANCE'
        error.cause = `The instance must be equal to ${component.const}`
        error.cause.cause = reason
        throw error
      }
    }
  }

  validateEnum(component, instance)
  {
    if('enum' in component)
    {
      let errors = 0

      for(const item of component.enum)
      {
        try
        {
          this.deepEqual(instance, item)
          break
        }
        catch(error)
        {
          errors++
        }
      }

      if(errors === component.enum.length)
      {
        const 
          enumsJson = component.enum.map(JSON.stringify),
          enumsList = this.listFormat.format(enumsJson)

        if(component.type)
        {
          const error = new Error(`Invalid ${component.type} instance ${instance}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          error.cause = `The ${component.type} must be one of: ${enumsList}`
          throw error
        }
        else
        {
          const error = new Error(`Invalid instance ${instance}`)
          error.code  = 'E_OAS_INVALID_INSTANCE'
          error.cause = `The instance must be one of: ${enumsList}`
          throw error
        }
      }
    }
  }

  validateStringFormatDate(instance)
  {
    const date = new Date(instance).toJSON()?.slice(0, 10)

    if(date !== instance)
    {
      const error = new Error(`Invalid date instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The date must be in the format YYYY-MM-DD'
      throw error
    }
  }

  validateStringFormatTime(instance)
  {
    const time = new Date('2000-01-01T' + instance + 'Z').toJSON()?.slice(11, 23)

    if(false === !!time?.startsWith(instance))
    {
      const error = new Error(`Invalid time instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The time must be in the format HH:MM:SS[.sss]'
      throw error
    }
  }

  validateStringFormatDatetime(instance)
  {
    if(isNaN(new Date(instance)))
    {
      const error = new Error(`Invalid datetime instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The datetime must be a valid date'
      throw error
    }
  }

  validateStringFormatBase64(instance)
  {
    if(false === /^[a-z0-9\+\/]*={0,2}$/i.test(instance))
    {
      const error = new Error(`Invalid base64 instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The base64 must be in the format aGVsbG8='
      throw error
    }
  }

  validateStringFormatEmail(instance)
  {
    if(false === /^[^@]+@[^@]+$/.test(instance))
    {
      const error = new Error(`Invalid email instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The email must be in the format example@domain'
      throw error
    }
  }

  validateStringFormatIpv4(instance)
  {
    if(false === net.isIPv4(instance))
    {
      const error = new Error(`Invalid ipv4 instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The ipv4 must be in valid ipv4 format'
      throw error
    }
  }

  validateStringFormatIpv6(instance)
  {
    if(false === net.isIPv6(instance))
    {
      const error = new Error(`Invalid ipv6 instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The ipv6 must be in valid ipv6 format'
      throw error
    }
  }

  validateStringFormatUrl(instance)
  {
    try
    {
      new URL(instance)
    }
    catch(reason)
    {
      const error = new Error(`Invalid URL instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = reason
      throw error
    }
  }

  // RFC 4122. Section 3. Format
  validateStringFormatUuid(instance)
  {
    if(false === /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(instance))
    {
      const error = new Error(`Invalid UUID instance ${instance}`)
      error.code  = 'E_OAS_INVALID_INSTANCE'
      error.cause = 'The UUID must be in the format FFFFFFFF-FFFF-5FFF-BFFF-FFFFFFFFFFFF'
      throw error
    }
  }
}