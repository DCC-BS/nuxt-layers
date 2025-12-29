/**
 * Function type for processing backend responses before returning to the client
 * @template T - The backend response type
 * @template D - The final response type to return to the client
 */
export type BackendTransformer<TResponse, TTransformed> = (response: TResponse) => Promise<TTransformed>;

/**
 * Default response handler that simply passes through the backend response
 * @template TBackendResponse - The type of response from the backend
 * @template TResponse - The final response type (defaults to backend response type)
 * @param response - The response from the backend API
 * @returns Promise resolving to the response cast to the expected type
 */
export async function defaultTransformer<TResponse>(
    response: TResponse,
): Promise<TResponse> {
    return response as unknown as TResponse;
}
