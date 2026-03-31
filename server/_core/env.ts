export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Azure Video Indexer
  AZURE_TENANT_ID: process.env.AZURE_TENANT_ID ?? "",
  AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID ?? "",
  AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET ?? "",
  AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID ?? "",
  AZURE_RESOURCE_GROUP: process.env.AZURE_RESOURCE_GROUP ?? "",
  AZURE_VIDEO_INDEXER_ACCOUNT_NAME: process.env.AZURE_VIDEO_INDEXER_ACCOUNT_NAME ?? "",
  AZURE_VIDEO_INDEXER_ACCOUNT_ID: process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID ?? "",
  AZURE_VIDEO_INDEXER_LOCATION: process.env.AZURE_VIDEO_INDEXER_LOCATION ?? "",
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // RapidAPI
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ?? "",
  RAPIDAPI_TIKTOK_KEY: process.env.RAPIDAPI_TIKTOK_KEY ?? "",
  // Coconut.co Video Processing
  COCONUT_API_KEY: process.env.COCONUT_API_KEY ?? "",
};
