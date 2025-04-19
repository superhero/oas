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
    const error  = new Error(`Invalid request-body for operation ${session.route.oas[request.method].operationId}`)
    error.code   = 'E_OAS_INVALID_REQUEST_BODY'
    error.cause  = reason
    error.status = 400
    session.abortion.abort(error)
  }
}