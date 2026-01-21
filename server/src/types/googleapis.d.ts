declare module 'googleapis' {
  export interface OAuth2Tokens {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
  }

  export class OAuth2 {
    constructor(clientId: string, clientSecret: string, redirectUri?: string);
    generateAuthUrl(options: {
      access_type?: string;
      scope?: string[] | string;
      prompt?: string;
      state?: string;
    }): string;
    getToken(code: string): Promise<{ tokens: OAuth2Tokens }>;
    setCredentials(credentials: OAuth2Tokens): void;
    refreshAccessToken(): Promise<{ credentials: OAuth2Tokens }>;
  }

  export const google: {
    auth: {
      OAuth2: typeof OAuth2;
    };
    gmail: (options: { version: string; auth: OAuth2 }) => {
      users: {
        getProfile: (args: { userId: string }) => Promise<{
          data: { emailAddress?: string | null };
        }>;
        messages: {
          list: (args: {
            userId: string;
            maxResults?: number;
            q?: string;
          }) => Promise<{
            data: { messages?: Array<{ id?: string | null }> };
          }>;
          get: (args: {
            userId: string;
            id: string;
            format?: string;
          }) => Promise<{
            data: unknown;
          }>;
        };
      };
    };
  };
}
