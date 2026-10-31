export interface OauthClient {
  /**
   * Verify the credential with the provider and return the user's profile.
   * Throws `UnauthorizedException` if the provider rejects it.
   * @param payload
   */
  getProfile<T = any>(payload: Record<string, any>): Promise<T>;
}
