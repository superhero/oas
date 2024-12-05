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
    const
      method      = request.method.toLowerCase(),
      parameters  = session.route.oas[method].parameters

    if(parameters)
    {
      for(const parameter of parameters)
      {
        this.oas.parameters.conform(parameter, request)
      }
    }
  }

  onError(error, request, session)
  {
    if('E_OAS_INVALID_INSTANCE' === error.code)
    {
      error.status = 400
      return session.abortion.abort(error)
    }
    else
    {
      throw error
    }
  }
}