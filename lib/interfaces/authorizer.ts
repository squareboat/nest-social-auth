export interface OauthClient {
    /**
     * Return the value stored corresponding to the key
     * @param payload
     */
    getProfile<T>(payload: Record<string,any>): Promise<T>;
  
    // /**
    //  * Store the value with the passed key
    //  * @param key
    //  * @param value
    //  * @param ttl
    //  */
    // set(
    //   key: string,
    //   value: Record<string, any> | string,
    //   ttlInSec?: number,
    // ): Promise<string>;
  
    // /**
    //  * Check for existence of a particular key
    //  * @param key
    //  */
    // has(key: string): Promise<boolean>;
  
    // remember(key: string, ttl: number, cb: Function);
  
    // rememberForever(key: string, cb: Function);
  
    // forget(key: string);
  
    // /**
    //  * Check for existence of a particular key value pair
    //  * @param key
    //  * @param value
    //  */
    //  compare(key: string, value: any);
  }
  