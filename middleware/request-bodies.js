export function locate(locator)
{
  const oas = locator('@superhero/oas')
  return new RequestBodiesMiddleware(oas)
}

/**
 * @memberof Oas.Middleware
 */
export default class RequestBodiesMiddleware
{
  constructor(oas)
  {
    this.oas = oas
  }

  dispatch(request, session)
  {
    const requestBody = session.route.oas[request.method].requestBody
    requestBody && this.oas.requestBodies.conform(requestBody, request)
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