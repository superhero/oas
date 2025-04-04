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
    if('E_OAS_INVALID_INSTANCE' === reason.code)
    {
      reason.status = 400
      return session.abortion.abort(reason)
    }
    else
    {
      const error  = new Error(`Unable to conform the request-parameters for operation ${session.route.oas[request.method].operationId}`)
      error.code   = 'E_OAS_FAILED_TO_CONFORM_REQUEST_PARAMETERS'
      error.cause  = reason
      throw error
    }
  }
}