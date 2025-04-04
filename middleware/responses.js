export function locate(locator)
{
  const oas = locator('@superhero/oas')
  return new ResponsesMiddleware(oas)
}

/**
 * @memberof Oas.Middleware
 */
export default class ResponsesMiddleware
{
  constructor(oas)
  {
    this.oas = oas
  }

  async dispatch(request, session)
  {
    await session.chain.next()

    if(false === !!session.abortion.signal.aborted)
    {
      const 
        status    = session.view.status,
        responses = session.route.oas[request.method].responses

      this.oas.responses.conform(responses[status], session.view)
    }
  }
}