import Locate                   from '@superhero/locator'
import assert                   from 'node:assert'
import { before, suite, test }  from 'node:test'
import path                     from 'node:path'
import fs                       from 'node:fs/promises'
import OAS                      from '@superhero/oas'
import { findSpecification, loadSpecification } from '@superhero/oas'

suite('@superhero/oas', () =>
{
  test('should load OpenAPI specification', async () =>
  {
    const locator = new Locate()
    locator.config.assign(
    {
      'oas':
      {
        'paths':
        {
          '/':
          {
            'get':
            {
              'parameters': [],
              'requestBody':
              {
                'content':
                {
                  'application/json': {
                    'schema': { 'type': 'object' }
                  }
                }
              },
              'responses':
              {
                '200': { 'description': 'Root endpoint' }
              }
            }
          }
        }
      }
    })

    const instance = await locator.lazyload('@superhero/oas')

    assert(instance instanceof OAS, 'Loaded instance should be of class OAS')
    assert(instance.schemas,        'Instance should have schemas')
    assert(instance.headers,        'Instance should have headers')
    assert(instance.parameters,     'Instance should have parameters')
    assert(instance.requestBodies,  'Instance should have requestBodies')
    assert(instance.responses,      'Instance should have responses')

    const operation = locator.config.find('oas/paths/\\//get')

    assert.doesNotThrow(() =>
      instance.validateOperation(operation), 
      'Operation validation should not throw')
  })

  test('can denormalize an operation', async () =>
  {
    const specification = {
      components: {
        parameters: {
          UserId: {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        },
        requestBodies: {
          CreateUser: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        responses: {
          UserCreated: {
            description: 'User created successfully.'
          },
          BadRequest: {
            description: 'Invalid input.'
          }
        }
      }
    }
  
    const operation = {
      parameters: [
        { $ref: '#/components/parameters/UserId' }
      ],
      requestBody: {
        $ref: '#/components/requestBodies/CreateUser'
      },
      responses: {
        '201': { $ref: '#/components/responses/UserCreated' },
        '400': { $ref: '#/components/responses/BadRequest' }
      }
    }

    const 
      oas           = new OAS(specification),
      denormalized  = oas.denormalizeOperation(operation)

    assert.deepEqual(denormalized,
    {
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'User created successfully.' },
        '400': { description: 'Invalid input.' }
      }
    })
  })
})
  
suite('@superhero/oas/loader', () => 
{
  const configDir = './test/mock-config'
  const absPath   = path.resolve(configDir, 'oas.json')

  before(async () => 
  {
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(absPath, JSON.stringify({ openapi: '3.0.0', info: { title: 'test', version: '1.0.0' } }), 'utf8')
  })

  test('merges inline and file-based entries', async () => 
  {
    const oasEntries = 
    [
      [ '/some/config/path.json', { openapi: '3.0.0', info: { title: 'inline', version: '1.0.0' } } ],
      [ '/some/config/path.json', absPath ]
    ]

    const result = await findSpecification(oasEntries)
    assert.strictEqual(result.openapi, '3.0.0')
    assert.strictEqual(result.info.title, 'inline')
  })

  test('fails on unreadable file', async () => 
  {
    await assert.rejects(
      () => loadSpecification('non-existent-file.json'),
      { code: 'E_OAS_LOAD_SPECIFICATION' })
  })
})