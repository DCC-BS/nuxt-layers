// backend_communication: forwards to `${API_URL}/echo/<id>?q=<q>` with the request body
export default backendHandlerBuilder().build("/echo/[r:id]?q=[q:q]");
