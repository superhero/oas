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

### Initiate the OAS component

Initiate the `@superhero/oas` library with the contextual specification:

```javascript
import OAS from '@superhero/oas'

// @see {@link https://spec.openapis.org/oas/v3.0.4.html | OAS standard}
specification = { ... }
const oas = new OAS(specification)
```

Using the `@superhero/core` library by adding a component that configures the `oas` key in its configurations:

```javascript
import Core from '@superhero/core'

const core = new Core()
core.add('@superhero/oas')
core.add('./sub-domain/use-case') // path to a config file with the defined specifications
await core.bootstrap()
```

### HTTP Server and Router

To Adapt the solution to be used in the context of routing and serving HTTP requests, see [@superhero/http-server-using-oas](https://github.com/superhero/http-server-using-oas).

## Error Handling

The library throws descriptive errors for invalid specifications or operations.

## Testing

To run the tests, execute:

```bash
npm test
```

### Test Coverage

```
────────────────────────────────── ⋅⋆ Suite ⋆⋅ ─────────────────────────────────


@superhero/oas/headers 
├─ conform 
│  ├─ returns instance as-is if no schema and not required ✔ 3.334ms
│  ├─ throws if required and missing ✔ 2.930ms
│  ├─ returns undefined if not required and instance is missing ✔ 2.141ms
│  ├─ validates schema if present ✔ 1.473ms
│  ├─ throws if schema validation fails ✔ 0.293ms
│  ├─ returns conformed value from schema ✔ 0.288ms
│  ├─ throws if $ref is invalid ✔ 6.272ms
│  └─ ✔ 19.451ms
└─ ✔ 20.787ms

@superhero/oas/parameters 
├─ conform 
│  ├─ conforms a required query parameter with schema ✔ 6.999ms
│  ├─ uses default if missing and defined ✔ 0.830ms
│  ├─ throws if required and missing ✔ 3.908ms
│  ├─ allows null if nullable ✔ 2.078ms
│  ├─ extracts from path and explodes ✔ 1.164ms
│  ├─ extracts from header without explode ✔ 0.476ms
│  ├─ extracts multiple from query with explode ✔ 0.568ms
│  ├─ returns undefined if not required and not present ✔ 0.484ms
│  ├─ throws on unsupported allowReserved ✔ 1.326ms
│  ├─ throws on unsupported style ✔ 1.039ms
│  ├─ throws on invalid $ref target ✔ 0.742ms
│  └─ ✔ 23.410ms
├─ validateComponent 
│  ├─ throws if not array ✔ 0.588ms
│  ├─ an array of parameter objects are not valid ✔ 0.278ms
│  ├─ throws if parameter is not object ✔ 0.296ms
│  ├─ throws if name is missing ✔ 0.309ms
│  ├─ throws if in is missing ✔ 0.260ms
│  ├─ throws if in is invalid ✔ 2.611ms
│  └─ ✔ 5.428ms
└─ ✔ 29.914ms

@superhero/oas/request-bodies 
├─ conform 
│  ├─ conforms valid application/json request body ✔ 6.473ms
│  ├─ throws if content-type does not match ✔ 7.348ms
│  ├─ supports wildcard content type ✔ 3.554ms
│  ├─ throws if matching content-type lacks schema ✔ 0.518ms
│  ├─ throws on invalid $ref ✔ 0.897ms
│  └─ ✔ 21.101ms
├─ validateComponent 
│  ├─ valid component with application/json ✔ 1.337ms
│  ├─ throws if content is not an object ✔ 0.306ms
│  ├─ throws if application/json is missing ✔ 15.538ms
│  ├─ throws if multiple content types defined ✔ 1.624ms
│  ├─ allows $ref only without content ✔ 0.960ms
│  └─ ✔ 20.449ms
└─ ✔ 42.639ms

@superhero/oas/responses 
├─ conform 
│  ├─ sets response body and content-type header from schema ✔ 6.594ms
│  ├─ throws if unsupported content type in content ✔ 1.212ms
│  ├─ does not fail if content has no schema ✔ 0.778ms
│  ├─ sets response headers using header schema ✔ 3.203ms
│  ├─ throws on invalid header schema ✔ 0.633ms
│  ├─ throws if headers is not an object ✔ 0.421ms
│  ├─ passes through if component is a $ref ✔ 1.093ms
│  └─ ✔ 16.309ms
├─ validateRefPointer 
│  ├─ accepts valid pointer ✔ 1.237ms
│  ├─ throws on invalid pointer ✔ 0.481ms
│  └─ ✔ 2.340ms
├─ validateComponentAttributes 
│  ├─ does not throw if an empty response object ✔ 0.387ms
│  ├─ throws if status code is invalid ✔ 1.342ms
│  └─ ✔ 1.950ms
└─ ✔ 24.313ms

@superhero/oas/schemas 
├─ Supported attributes 
│  ├─ type:boolean 
│  │  ├─ nullable enum ✔ 3.775ms
│  │  ├─ throws if invalid enum type ✔ 0.331ms
│  │  ├─ casts strings that can be interpreted as a boolean value to boolean ✔ 0.401ms
│  │  ├─ throws if invalid ✔ 0.313ms
│  │  └─ ✔ 9.994ms
│  ├─ type:integer 
│  │  ├─ nullable enum ✔ 1.076ms
│  │  ├─ minimum ✔ 0.755ms
│  │  ├─ maximum ✔ 0.630ms
│  │  ├─ exclusiveMinimum ✔ 0.793ms
│  │  ├─ exclusiveMaximum ✔ 0.449ms
│  │  ├─ multipleOf ✔ 0.569ms
│  │  ├─ format int32 ✔ 0.541ms
│  │  ├─ format int64 ✔ 0.868ms
│  │  ├─ throws if invalid format ✔ 0.564ms
│  │  ├─ throws if invalid enum type ✔ 0.297ms
│  │  ├─ throws if a decimal ✔ 0.278ms
│  │  └─ ✔ 13.597ms
│  ├─ type:number 
│  │  ├─ nullable enum ✔ 0.395ms
│  │  ├─ format float ✔ 0.735ms
│  │  ├─ format double ✔ 0.436ms
│  │  ├─ throws if invalid enum type ✔ 0.325ms
│  │  ├─ casts strings that can be interpreted as a number value to number ✔ 0.338ms
│  │  └─ ✔ 5.914ms
│  ├─ type:string 
│  │  ├─ nullable enum ✔ 0.497ms
│  │  ├─ minLength ✔ 14.468ms
│  │  ├─ maxLength ✔ 0.579ms
│  │  ├─ pattern ✔ 0.522ms
│  │  ├─ format date ✔ 25.211ms
│  │  ├─ format time ✔ 2.497ms
│  │  ├─ format datetime ✔ 5.707ms
│  │  ├─ format base64 ✔ 3.530ms
│  │  ├─ format email ✔ 1.841ms
│  │  ├─ format ipv4 ✔ 1.456ms
│  │  ├─ format ipv6 ✔ 54.619ms
│  │  ├─ url ✔ 1.262ms
│  │  ├─ format uuid ✔ 0.643ms
│  │  ├─ throws if invalid enum type ✔ 0.341ms
│  │  └─ ✔ 117.737ms
│  ├─ type:null 
│  │  ├─ throws if not null ✔ 0.631ms
│  │  ├─ throws if value is null and type is not null ✔ 0.368ms
│  │  └─ ✔ 2.132ms
│  ├─ type:undefined ✔ 0.546ms
│  ├─ type:array 
│  │  ├─ throws if invalid type ✔ 0.586ms
│  │  ├─ items ✔ 3.435ms
│  │  ├─ minItems ✔ 0.566ms
│  │  ├─ maxItems ✔ 0.780ms
│  │  ├─ uniqueItems ✔ 5.208ms
│  │  ├─ enum ✔ 0.570ms
│  │  ├─ throws if invalid enum type ✔ 0.335ms
│  │  ├─ nullable enum ✔ 0.359ms
│  │  ├─ nullable items ✔ 0.515ms
│  │  ├─ nullable enum items ✔ 0.762ms
│  │  └─ ✔ 17.138ms
│  ├─ type:object 
│  │  ├─ throws if invalid type ✔ 0.428ms
│  │  ├─ additionalProperties ✔ 1.131ms
│  │  ├─ minProperties ✔ 1.092ms
│  │  ├─ maxProperties ✔ 0.653ms
│  │  ├─ propertyNames pattern ✔ 0.641ms
│  │  ├─ nullable ✔ 0.440ms
│  │  ├─ enum ✔ 0.657ms
│  │  ├─ nullable enum ✔ 0.384ms
│  │  ├─ throws if invalid enum type ✔ 0.319ms
│  │  └─ ✔ 9.467ms
│  ├─ type:invalid throws ✔ 0.970ms
│  ├─ readOnly 
│  │  ├─ when is reading ✔ 0.407ms
│  │  ├─ when is writing ✔ 0.370ms
│  │  └─ ✔ 2.241ms
│  ├─ writeOnly 
│  │  ├─ when is reading ✔ 0.293ms
│  │  ├─ when is writing ✔ 0.223ms
│  │  └─ ✔ 1.066ms
│  ├─ default 
│  │  ├─ when no value ✔ 0.216ms
│  │  ├─ when value ✔ 0.178ms
│  │  └─ ✔ 0.739ms
│  ├─ if/then/else 
│  │  ├─ then ✔ 0.350ms
│  │  ├─ else ✔ 2.049ms
│  │  ├─ throws if invalid ✔ 2.442ms
│  │  └─ ✔ 5.922ms
│  ├─ not ✔ 5.518ms
│  ├─ allOf 
│  │  ├─ validates with additional fields ✔ 0.483ms
│  │  ├─ throws if all are not valid ✔ 2.168ms
│  │  └─ ✔ 4.057ms
│  ├─ anyOf 
│  │  ├─ conforms to valid schema ✔ 2.069ms
│  │  ├─ throws if none is valid ✔ 0.628ms
│  │  └─ ✔ 3.900ms
│  ├─ oneOf 
│  │  ├─ conforms to valid schema ✔ 0.399ms
│  │  ├─ throws if none is valid ✔ 0.495ms
│  │  ├─ throws if more than one is valid ✔ 1.231ms
│  │  └─ ✔ 3.105ms
│  ├─ const ✔ 3.748ms
│  ├─ deep const ✔ 0.992ms
│  ├─ throws on invalid $ref ✔ 1.337ms
│  ├─ throws on invalid schema ✔ 0.652ms
│  └─ ✔ 216.308ms
└─ ✔ 217.270ms

@superhero/oas 
├─ should load OpenAPI specification ✔ 69.428ms
├─ can denormalize an operation ✔ 15.748ms
└─ ✔ 92.228ms

@superhero/oas/loader 
├─ merges inline and file-based entries ✔ 6.104ms
├─ fails on unreadable file ✔ 3.544ms
└─ ✔ 61.519ms


──────────────────────────────── ⋅⋆ Coverage ⋆⋅ ────────────────────────────────


Files                                            Coverage   Functions   Branches
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/abstraction.js                             85%        100%        80%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/headers.js                                 84%         80%        94%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/headers.test.js                           100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/parameters.js                              92%        100%        88%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/parameters.test.js                        100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/request-bodies.js                         100%        100%        96%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/request-bodies.test.js                    100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/responses.js                               94%        100%        95%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/responses.test.js                         100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/schemas.js                                 97%        100%        95%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
components/schemas.test.js                           100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.js                                              81%        100%        60%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
index.test.js                                        100%        100%       100%
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Total                                                 96%        95%         99%


───────────────────────────────── ⋅⋆ Summary ⋆⋅ ────────────────────────────────


Suites                                                                        16
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Tests                                                                        141
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Passed                                                                       141
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Failed                                                                         0
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Cancelled                                                                      0
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Skipped                                                                        0
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Todo                                                                           0
```

## License

This project is licensed under the MIT License.

## Contributing

Feel free to submit issues or pull requests for improvements or additional features.
