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
    operation.parameters
    && this.parameters.validateComponent(operation.parameters)

    operation.requestBody
    && this.requestBodies.validateComponent(operation.requestBody)

    this.responses.validateComponent(operation.responses)
  }
}