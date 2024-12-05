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
▶ @superhero/oas/schemas
  ▶ Supported attributes
    ▶ type:boolean
      ✔ nullable enum (3.35678ms)
      ✔ throws if invalid enum type (0.300923ms)
      ✔ casts strings that can be interpreted as a boolean value to boolean (0.325861ms)
      ✔ throws if invalid (0.270627ms)
    ✔ type:boolean (6.104481ms)

    ▶ type:integer
      ✔ nullable enum (0.455196ms)
      ✔ minimum (0.190364ms)
      ✔ maximum (0.276653ms)
      ✔ exclusiveMinimum (0.311391ms)
      ✔ exclusiveMaximum (0.678551ms)
      ✔ multipleOf (0.457454ms)
      ✔ format int32 (0.319436ms)
      ✔ format int64 (0.357137ms)
      ✔ throws if invalid format (0.152509ms)
      ✔ throws if invalid enum type (0.134188ms)
      ✔ throws if a decimal (0.217675ms)
    ✔ type:integer (5.643484ms)

    ▶ type:number
      ✔ nullable enum (0.549315ms)
      ✔ format float (0.21403ms)
      ✔ format double (0.186924ms)
      ✔ throws if invalid enum type (0.221865ms)
      ✔ casts strings that can be interpreted as a number value to number (0.107354ms)
    ✔ type:number (2.023555ms)

    ▶ type:string
      ✔ nullable enum (1.457643ms)
      ✔ minLength (0.20732ms)
      ✔ maxLength (0.154873ms)
      ✔ pattern (0.303383ms)
      ✔ format date (1.632527ms)
      ✔ format time (0.389043ms)
      ✔ format datetime (0.413008ms)
      ✔ format base64 (0.432533ms)
      ✔ format email (0.23688ms)
      ✔ format ipv4 (1.006419ms)
      ✔ format ipv6 (6.590692ms)
      ✔ url (0.494795ms)
      ✔ format uuid (0.340933ms)
      ✔ throws if invalid enum type (0.139166ms)
    ✔ type:string (15.599415ms)

    ▶ type:null
      ✔ throws if not null (0.296927ms)
      ✔ throws if value is null and type is not null (0.210403ms)
    ✔ type:null (0.874171ms)

    ✔ type:undefined (0.140063ms)

    ▶ type:array
      ✔ throws if invalid type (0.359969ms)
      ✔ items (1.020706ms)
      ✔ additionalItems (0.21037ms)
      ✔ minItems (0.248753ms)
      ✔ maxItems (0.329635ms)
      ✔ uniqueItems (0.890805ms)
      ✔ enum (0.259908ms)
      ✔ throws if invalid enum type (0.304887ms)
      ✔ nullable enum (0.764214ms)
      ✔ nullable items (0.265034ms)
      ✔ nullable enum items (0.169632ms)
    ✔ type:array (6.446302ms)

    ▶ type:object
      ✔ throws if invalid type (0.282162ms)
      ✔ additionalProperties (0.33254ms)
      ✔ minProperties (0.22744ms)
      ✔ maxProperties (0.203384ms)
      ✔ propertyNames pattern (0.313919ms)
      ✔ nullable (0.111406ms)
      ✔ enum (0.243711ms)
      ✔ nullable enum (0.304399ms)
      ✔ throws if invalid enum type (0.132201ms)
    ✔ type:object (3.92496ms)

    ✔ type:invalid throws (0.146378ms)

    ▶ readOnly
      ✔ when is reading (0.130151ms)
      ✔ when is writing (0.166433ms)
    ✔ readOnly (0.514571ms)

    ▶ writeOnly
      ✔ when is reading (0.19847ms)
      ✔ when is writing (0.111985ms)
    ✔ writeOnly (0.519254ms)

    ▶ default
      ✔ when no value (0.122471ms)
      ✔ when value (0.109269ms)
    ✔ default (0.423953ms)

    ▶ if/then/else
      ✔ then (0.116916ms)
      ✔ else (0.202285ms)
      ✔ throws if invalid (0.391854ms)
    ✔ if/then/else (1.17015ms)

    ✔ not (0.250797ms)

    ▶ allOf
      ✔ result only what is expected (0.181802ms)
      ✔ throws if all are not valid (0.168471ms)
    ✔ allOf (1.106621ms)

    ▶ anyOf
      ✔ conforms to valid schema (0.147225ms)
      ✔ throws if none is valid (0.170714ms)
    ✔ anyOf (0.547187ms)

    ▶ oneOf
      ✔ conforms to valid schema (0.157463ms)
      ✔ throws if none is valid (0.12812ms)
      ✔ throws if more than one is valid (0.129512ms)
    ✔ oneOf (0.726333ms)

    ✔ const (0.305981ms)
    ✔ deep const (1.424227ms)
    ✔ throws on invalid $ref (0.605318ms)
    ✔ throws on invalid schema (0.147341ms)
  ✔ Supported attributes (49.751109ms)
✔ @superhero/oas/schemas (50.297111ms)

▶ @superhero/oas
  ✔ Can set a simple specification (79.360931ms)
  ✔ Can add middleware for requestBody content (10.793273ms)
  ✔ Can add middleware for parameters (8.350745ms)

  ▶ Specification with reference to components
    ✔ GET method using default parameter (31.754399ms)
    ✔ GET method not using required parameter (6.148027ms)
    ✔ GET method using path parameter (5.035696ms)
    ✔ GET method using query parameter (5.464326ms)
    ✔ GET method using header parameter (4.530933ms)
    ✔ POST method using request body (4.042791ms)
  ✔ Specification with reference to components (72.699754ms)

  ✔ Throws error for invalid paths type in specification (8.362196ms)
  ✔ Throws error for missing response (4.73213ms)
  ✔ Throws error for missing operationId in operation (7.265388ms)
  ✔ Throws error for missing responses in operation (7.791663ms)
  ✔ Throws error for missing response code (7.583666ms)
  ✔ Throws error for unsupported content type in requestBody (7.55338ms)
  ✔ Throws error for invalid parameters type (5.039937ms)
✔ @superhero/oas (222.477838ms)

tests 110
suites 3
pass 110

-----------------------------------------------------------------------------------------------------
file                 | line % | branch % | funcs % | uncovered lines
-----------------------------------------------------------------------------------------------------
components           |        |          |         | 
 abstraction.js      |  76.10 |    72.00 |  100.00 | 42-48 63-68 71-76 89-93 100-104 111-115 140-143
 headers.js          |  69.14 |    64.29 |   66.67 | 30-33 37-38 43-46 53-54 63-66 70-75 78-80
 parameters.js       |  70.43 |    77.78 |  100.00 | 65-69 98-101 128-132 142-164 167-184
 request-bodies.js   |  78.38 |    65.00 |  100.00 | 50-55 58-61 70-73 90-94 105-109
 responses.js        |  86.26 |    80.00 |  100.00 | 40-44 67-71 88-91 116-119
 schemas.js          | 100.00 |    98.00 |  100.00 | 
 schemas.test.js     | 100.00 |   100.00 |  100.00 | 
index.js             |  93.24 |    86.36 |  100.00 | 112-115 118-123
index.test.js        | 100.00 |   100.00 |   96.55 | 
middleware           |        |          |         | 
 parameters.js       |  90.91 |    88.89 |  100.00 | 39-42
 request-bodies.js   | 100.00 |   100.00 |  100.00 | 
 responses.js        | 100.00 |   100.00 |  100.00 | 
-----------------------------------------------------------------------------------------------------
all files            |  94.81 |    94.28 |   99.26 | 
-----------------------------------------------------------------------------------------------------
```

## License

This project is licensed under the MIT License.

## Contributing

Feel free to submit issues or pull requests for improvements or additional features.
