# OAS

A Node.js library for integrating OpenAPI specifications into an application. With @superhero/oas, you can define, validate, and route API operations using OpenAPI's structured standard.

**OBS!** This is an early release of this component.

## Features

- Builds API routes from OpenAPI specifications.
- Validate request parameters, bodies, and responses using OpenAPI schemas.
- Supports OpenAPI components for modular and reusable specifications.
- Middlewares for handling parameters, request bodies, and responses.

## Installation

Install via npm:

```bash
npm install @superhero/oas
```

## Usage

### Defining an OpenAPI Specification

For detailed information about how to define an OpenAPI Specification, refer to the [OpenAPI Specification Documentation](https://spec.openapis.org/oas/latest.html).

### Bootstrapping the Library

Set up and bootstrap the `@superhero/oas` library with your specification:

```javascript
import HttpServer from '@superhero/http-server';
import Locator    from '@superhero/locator';
import OAS        from '@superhero/oas';
import Router     from '@superhero/router';

// Instantiate the service locator
const locator = new Locator();

// Instantiate the router
const router = new Router(locator);

// Instantiate the server
const server = new HttpServer(router);

// Instantiate the OAS instance
const oas = new OAS(router)

// Register the route dispatcher service
locator.set('hello-dispatcher', {
  dispatch: (request, session) => {
    session.view.body.message = 'Hello, World!';
  },
});

// Bootstrap and start the server
await server.bootstrap();
await server.listen(3000);

// Routes
const specification = {
  paths: {
    '/example': {
      get: {
        operationId: 'hello-dispatcher',
        responses: { 200: { description: 'Hello World' } },
      },
    },
  },
};

oas.bootstrap(specification)
```

### Adding Middleware for Parameters and Request Bodies

The library automatically adds middleware for validating request parameters, request bodies, and responses as defined in the specification.

For example:

```javascript
const specification = {
  paths: {
    '/example': {
      post: {
        operationId: 'example',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  age: { type: 'integer', minimum: 0 },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Created' },
          400: { description: 'Validation Error' },
        },
      },
    },
  },
};

oas.bootstrap(specification);
```

This will ensure:
- Request parameters are validated.
- Request bodies are checked against the defined schema.
- Responses are validated according to the specification.
- A dispatcher called `example` will dispatch the request.

### Setting Up a Dispatcher

Map the `operationId` from your specification to a dispatcher:

```javascript
locate.set('example-reader', {
  dispatch: (request, session) => {
    session.view.body = { message: `Fetched data for ID: ${request.param.id}` };
  },
});

locate.set('example-writer', {
  dispatch: (request, session) => {
    session.view.body = { message: `Created data for ${request.body.name}` };
  },
});
```

## Error Handling

The library throws descriptive errors _(will be improved on in comming versions)_ for invalid specifications or operations.

## Testing

The test suite uses Node.js's built-in testing module.

### Running Tests

To run the tests, execute:

```bash
npm test
```

### Test Coverage

```
────────────────────────────────── ⋅⋆ Suite ⋆⋅ ─────────────────────────────────


@superhero/oas/headers 
├─ conform 
│  ├─ returns instance as-is if no schema and not required ✔ 1.463ms
│  ├─ throws if required and missing ✔ 2.264ms
│  ├─ returns undefined if not required and instance is missing ✔ 1.807ms
│  ├─ validates schema if present ✔ 2.282ms
│  ├─ throws if schema validation fails ✔ 0.359ms
│  ├─ returns conformed value from schema ✔ 0.469ms
│  ├─ throws if $ref is invalid ✔ 0.774ms
│  └─ ✔ 11.524ms
└─ ✔ 12.586ms

@superhero/oas/parameters 
├─ conform 
│  ├─ conforms a required query parameter with schema ✔ 5.971ms
│  ├─ uses default if missing and defined ✔ 0.840ms
│  ├─ throws if required and missing ✔ 2.958ms
│  ├─ allows null if nullable ✔ 0.890ms
│  ├─ extracts from path and explodes ✔ 1.077ms
│  ├─ extracts from header without explode ✔ 0.494ms
│  ├─ extracts multiple from query with explode ✔ 0.770ms
│  ├─ returns undefined if not required and not present ✔ 0.499ms
│  ├─ throws on unsupported allowReserved ✔ 1.132ms
│  ├─ throws on unsupported style ✔ 0.686ms
│  ├─ throws on invalid $ref target ✔ 0.536ms
│  └─ ✔ 18.643ms
├─ validateComponent 
│  ├─ throws if not array ✔ 0.558ms
│  ├─ validates an array of parameter objects ✔ 1.140ms
│  ├─ throws if parameter is not object ✔ 0.314ms
│  ├─ throws if name is missing ✔ 0.241ms
│  ├─ throws if in is missing ✔ 0.196ms
│  ├─ throws if in is invalid ✔ 0.276ms
│  └─ ✔ 3.101ms
└─ ✔ 23.056ms

@superhero/oas/request-bodies 
├─ conform 
│  ├─ conforms valid application/json request body ✔ 8.238ms
│  ├─ throws if content-type does not match ✔ 1.203ms
│  ├─ supports wildcard content type ✔ 0.377ms
│  ├─ throws if matching content-type lacks schema ✔ 0.462ms
│  ├─ throws on invalid $ref ✔ 0.732ms
│  └─ ✔ 13.382ms
├─ validateComponent 
│  ├─ valid component with application/json ✔ 1.221ms
│  ├─ throws if content is not an object ✔ 0.403ms
│  ├─ throws if application/json is missing ✔ 0.751ms
│  ├─ throws if multiple content types defined ✔ 0.765ms
│  ├─ allows $ref only without content ✔ 0.657ms
│  └─ ✔ 6.671ms
└─ ✔ 21.613ms

@superhero/oas/responses 
├─ conform 
│  ├─ sets response body and content-type header from schema ✔ 9.202ms
│  ├─ throws if unsupported content type in content ✔ 0.975ms
│  ├─ does not fail if content has no schema ✔ 0.271ms
│  ├─ sets response headers using header schema ✔ 0.916ms
│  ├─ throws on invalid header schema ✔ 0.364ms
│  ├─ throws if headers is not an object ✔ 0.285ms
│  ├─ passes through if component is a $ref ✔ 3.124ms
│  └─ ✔ 17.570ms
├─ validateRefPointer 
│  ├─ accepts valid pointer ✔ 0.484ms
│  ├─ throws on invalid pointer ✔ 0.658ms
│  └─ ✔ 2.015ms
├─ validateComponentAttributes 
│  ├─ throws if empty response object ✔ 0.892ms
│  ├─ throws if status code is invalid ✔ 1.501ms
│  ├─ accepts valid status code response object ✔ 0.291ms
│  └─ ✔ 3.201ms
└─ ✔ 26.005ms

@superhero/oas/schemas 
├─ Supported attributes 
│  ├─ type:boolean 
│  │  ├─ nullable enum ✔ 4.777ms
│  │  ├─ throws if invalid enum type ✔ 1.838ms
│  │  ├─ casts strings that can be interpreted as a boolean value to boolean ✔ 0.861ms
│  │  ├─ throws if invalid ✔ 0.393ms
│  │  └─ ✔ 12.113ms
│  ├─ type:integer 
│  │  ├─ nullable enum ✔ 1.286ms
│  │  ├─ minimum ✔ 0.467ms
│  │  ├─ maximum ✔ 0.530ms
│  │  ├─ exclusiveMinimum ✔ 0.554ms
│  │  ├─ exclusiveMaximum ✔ 0.642ms
│  │  ├─ multipleOf ✔ 2.196ms
│  │  ├─ format int32 ✔ 1.243ms
│  │  ├─ format int64 ✔ 0.727ms
│  │  ├─ throws if invalid format ✔ 0.334ms
│  │  ├─ throws if invalid enum type ✔ 0.360ms
│  │  ├─ throws if a decimal ✔ 0.430ms
│  │  └─ ✔ 13.270ms
│  ├─ type:number 
│  │  ├─ nullable enum ✔ 0.315ms
│  │  ├─ format float ✔ 1.323ms
│  │  ├─ format double ✔ 1.037ms
│  │  ├─ throws if invalid enum type ✔ 0.418ms
│  │  ├─ casts strings that can be interpreted as a number value to number ✔ 0.482ms
│  │  └─ ✔ 5.592ms
│  ├─ type:string 
│  │  ├─ nullable enum ✔ 0.424ms
│  │  ├─ minLength ✔ 0.386ms
│  │  ├─ maxLength ✔ 0.604ms
│  │  ├─ pattern ✔ 0.845ms
│  │  ├─ format date ✔ 6.135ms
│  │  ├─ format time ✔ 0.743ms
│  │  ├─ format datetime ✔ 0.469ms
│  │  ├─ format base64 ✔ 0.630ms
│  │  ├─ format email ✔ 0.395ms
│  │  ├─ format ipv4 ✔ 1.505ms
│  │  ├─ format ipv6 ✔ 16.426ms
│  │  ├─ url ✔ 1.158ms
│  │  ├─ format uuid ✔ 0.636ms
│  │  ├─ throws if invalid enum type ✔ 0.247ms
│  │  └─ ✔ 36.953ms
│  ├─ type:null 
│  │  ├─ throws if not null ✔ 0.268ms
│  │  ├─ throws if value is null and type is not null ✔ 0.225ms
│  │  └─ ✔ 1.063ms
│  ├─ type:undefined ✔ 0.186ms
│  ├─ type:array 
│  │  ├─ throws if invalid type ✔ 0.411ms
│  │  ├─ items ✔ 1.743ms
│  │  ├─ additionalItems ✔ 0.303ms
│  │  ├─ minItems ✔ 0.937ms
│  │  ├─ maxItems ✔ 0.500ms
│  │  ├─ uniqueItems ✔ 1.848ms
│  │  ├─ enum ✔ 0.621ms
│  │  ├─ throws if invalid enum type ✔ 0.345ms
│  │  ├─ nullable enum ✔ 0.324ms
│  │  ├─ nullable items ✔ 1.100ms
│  │  ├─ nullable enum items ✔ 0.341ms
│  │  └─ ✔ 10.676ms
│  ├─ type:object 
│  │  ├─ throws if invalid type ✔ 0.254ms
│  │  ├─ additionalProperties ✔ 0.563ms
│  │  ├─ minProperties ✔ 0.464ms
│  │  ├─ maxProperties ✔ 0.505ms
│  │  ├─ propertyNames pattern ✔ 0.767ms
│  │  ├─ nullable ✔ 0.390ms
│  │  ├─ enum ✔ 0.580ms
│  │  ├─ nullable enum ✔ 1.333ms
│  │  ├─ throws if invalid enum type ✔ 0.480ms
│  │  └─ ✔ 9.152ms
│  ├─ type:invalid throws ✔ 0.567ms
│  ├─ readOnly 
│  │  ├─ when is reading ✔ 0.700ms
│  │  ├─ when is writing ✔ 0.483ms
│  │  └─ ✔ 1.931ms
│  ├─ writeOnly 
│  │  ├─ when is reading ✔ 0.390ms
│  │  ├─ when is writing ✔ 0.496ms
│  │  └─ ✔ 2.215ms
│  ├─ default 
│  │  ├─ when no value ✔ 0.359ms
│  │  ├─ when value ✔ 0.243ms
│  │  └─ ✔ 1.184ms
│  ├─ if/then/else 
│  │  ├─ then ✔ 0.211ms
│  │  ├─ else ✔ 1.143ms
│  │  ├─ throws if invalid ✔ 4.262ms
│  │  └─ ✔ 6.617ms
│  ├─ not ✔ 1.163ms
│  ├─ allOf 
│  │  ├─ validates with additional fields ✔ 0.302ms
│  │  ├─ throws if all are not valid ✔ 0.404ms
│  │  └─ ✔ 1.832ms
│  ├─ anyOf 
│  │  ├─ conforms to valid schema ✔ 0.578ms
│  │  ├─ throws if none is valid ✔ 0.537ms
│  │  └─ ✔ 1.644ms
│  ├─ oneOf 
│  │  ├─ conforms to valid schema ✔ 1.316ms
│  │  ├─ throws if none is valid ✔ 0.743ms
│  │  ├─ throws if more than one is valid ✔ 0.398ms
│  │  └─ ✔ 3.654ms
│  ├─ const ✔ 1.637ms
│  ├─ deep const ✔ 2.313ms
│  ├─ throws on invalid $ref ✔ 1.415ms
│  ├─ throws on invalid schema ✔ 1.427ms
│  └─ ✔ 119.697ms
└─ ✔ 120.628ms

@superhero/oas 
├─ should load OpenAPI specification ✔ 67.797ms
└─ ✔ 70.030ms

@superhero/oas/loader 
├─ merges inline and file-based entries ✔ 4.740ms
├─ fails on unreadable file ✔ 3.940ms
└─ ✔ 28.620ms

──────────────────────────────── ⋅⋆ Coverage ⋆⋅ ────────────────────────────────


Files                                            Coverage   Functions   Branches
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/abstraction.js                             81%        100%        73%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/headers.js                                 95%        100%        94%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/headers.test.js                           100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/parameters.js                              97%        100%        93%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/parameters.test.js                        100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/request-bodies.js                         100%        100%        95%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/request-bodies.test.js                    100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/responses.js                              100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/responses.test.js                         100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/schemas.js                                 98%        100%        96%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/schemas.test.js                           100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.js                                              92%        100%        80%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.test.js                                        100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Total                                                 98%        97%        100%
```

## License

This project is licensed under the MIT License.

## Contributing

Feel free to submit issues or pull requests for improvements or additional features.
