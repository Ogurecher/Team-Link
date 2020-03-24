export function setEnvVariables (): void {
    process.env.OAUTH_ACCESS_TOKEN_USER = 'not provided';
    process.env.OAUTH_TENANT_ID = 'not provided';
    process.env.OAUTH_CLIENT_ID = 'not provided';
    process.env.OAUTH_CLIENT_SECRET = 'not provided';
    process.env.OAUTH_REFRESH_TOKEN_USER = 'not provided';
}
