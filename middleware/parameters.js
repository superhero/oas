export function locate(locator)
{
  const oas = locator('@superhero/oas')
  return new ParametersMiddleware(oas)
}

/**
 * @memberof Oas.Middleware
 */
export default class ParametersMiddleware
{
  constructor(oas)
  {
    this.oas = oas
  }

  dispatch(request, session)
  {
    const parameters = session.route.oas[request.method].parameters

    if(parameters)
    {
      for(const parameter of parameters)
      {
        this.oas.parameters.conform(parameter, request)
      }
    }
  }

  onError(reason, request, session)
  {
    const error  = new Error(`Invalid request-parameters for operation ${session.route.oas[request.method].operationId}`)
    error.code   = 'E_OAS_INVALID_REQUEST_PARAMETERS'
    error.cause  = reason
    error.status = 400
    session.abortion.abort(error)
  }
}