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

  onError(reason, request, session)
  {
    if('E_OAS_INVALID_INSTANCE' === reason.code)
    {
      reason.status = 400
      return session.abortion.abort(reason)
    }
    else
    {
      const error  = new Error(`Unable to conform the request-body for operation ${session.route.oas[request.method].operationId}`)
      error.code   = 'E_OAS_FAILED_TO_CONFORM_REQUEST_BODY'
      error.cause  = reason
      throw error
    }
  }
}