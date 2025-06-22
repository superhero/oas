import deepmerge      from '@superhero/deep/merge'
import Headers        from '@superhero/oas/components/headers'
import Parameters     from '@superhero/oas/components/parameters'
import RequestBodies  from '@superhero/oas/components/request-bodies'
import Responses      from '@superhero/oas/components/responses'
import Schemas        from '@superhero/oas/components/schemas'
import path           from 'node:path'
import fs             from 'node:fs/promises'

export async function locate(locator)
{
  try
  {
    const
      oasEntries    = locator.config.findAbsolutePathAndValueByConfigPath('oas'),
      specification = await findSpecification(oasEntries)

    return new OAS(specification)
  }
  catch(reason)
  {
    const error = new Error(`Failed to locate OpenAPI Specification`)
    error.code  = 'E_OAS_LOCATE'
    error.cause = reason
    throw error
  }
}

/**
 * Find the OpenAPI Specification in the configuration, and locates it from disk 
 * if a string path is configured.
 * @param {'Array<Array<string, *>>'} oasEntries
 * @returns {Promise<Object>} The OpenAPI Specification object.
 */
export async function findSpecification(oasEntries)
{
  const collection = []

  for(let [ configFilePath, specifications ] of oasEntries)
  {
    for(let specification of [ specifications ].flat())
    {
      if('string' === typeof specification)
      {
        let oasPath = specification

        if(false === path.isAbsolute(oasPath))
        {
          oasPath = path.join(path.dirname(configFilePath), oasPath)
        }

        specification = await loadSpecification(oasPath)
      }

      collection.unshift(specification)
    }
  }

  return deepmerge(...collection)
}

/**
 * Load the OpenAPI Specification from a file.
 * @param {string} filepath - The path to the OpenAPI Specification file.
 * @returns {Promise<Object>} The parsed OpenAPI Specification object.
 * @throws {Error} E_OAS_LOAD_SPECIFICATION - If the file cannot be read or parsed.
 */
export async function loadSpecification(filepath)
{
  try
  {
    let specification

    specification = await fs.readFile(filepath, 'utf8')
    specification = JSON.parse(specification)

    return specification
  }
  catch(reason)
  {
    const error = new Error(`Failed to load OpenAPI Specification from "${filepath}"`)
    error.code  = 'E_OAS_LOAD_SPECIFICATION'
    error.cause = reason
    throw error
  }
}

export default class OAS
{
  constructor(specification)
  {
    this.specification  = specification

    this.schemas        = new Schemas(specification)
    this.headers        = new Headers(specification)
    this.parameters     = new Parameters(specification)
    this.requestBodies  = new RequestBodies(specification)
    this.responses      = new Responses(specification)
  }

  validateOperation(operation)
  {
    // Validate parameters
    // -------------------

    switch(Object.prototype.toString.call(operation.parameters))
    {
      case '[object Undefined]':
      {
        // No parameters to validate
        break
      }

      case '[object Array]':
      {
        for(const parameter of operation.parameters)
        {
          this.parameters.validateComponent(parameter)
        }
        break
      }

      default:
      {
        const error = new Error(`Failed to validate operation parameters`)
        error.code  = 'E_OAS_VALIDATE_OPERATION'
        error.cause = 'The parameters specification in the operation must be an Array if defined'
        throw error
      }
    }

    // Validate request body
    // ---------------------

    operation.requestBody
    && this.requestBodies.validateComponent(operation.requestBody)

    // Validate responses
    // ------------------

    if('[object Object]' !== Object.prototype.toString.call(operation.responses))
    {
      const error = new Error(`Invalid responses specification type of the operation`)
      error.code  = 'E_OAS_VALIDATE_OPERATION'
      error.cause = 'The responses specification in the operation must be an object'
      throw error
    }

    if(Object.keys(operation.responses).length === 0)
    {
      const error = new Error('The responses specification of the operation must declare at least one response')
      error.code  = 'E_OAS_VALIDATE_OPERATION'
      error.cause = 'The responses specification is expected to define at least one response status code'
      throw error
    }

    for(const status in operation.responses)
    {
      if(status < 100 
      || status > 599)
      {
        const error = new Error(`Invalid responses specification of the operation`)
        error.code  = 'E_OAS_VALIDATE_OPERATION'
        error.cause = `The status code "${status}" is not a valid HTTP status code`
        throw error
      }
      else
      {
        this.responses.validateComponent(operation.responses[status])
      }
    }
  }

  denormalizeOperation(operation)
  {
    if(operation.parameters)
    {
      operation.parameters = operation.parameters.map(parameter => this.parameters.denormalize(parameter))
    }

    if(operation.requestBody)
    {
      operation.requestBody = this.requestBodies.denormalize(operation.requestBody)
    }

    for(const status in operation.responses)
    {
      operation.responses[status] = this.responses.denormalize(operation.responses[status])
    }

    return operation
  }
}