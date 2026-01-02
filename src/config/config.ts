export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  firebase: {
    serviceAccountPath:
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      './secrets/firebase-admin-backend.json',
  },
  gcs: {
    avatarsBucket: process.env.GCS_AVATARS_BUCKET || 'tribr-avatars',
    profileVideosBucket:
      process.env.GCS_PROFILE_VIDEOS_BUCKET || 'tribr-profile-videos',
    walletDocumentsBucket:
      process.env.GCS_WALLET_DOCUMENTS_BUCKET || 'wallet-documents',
  },
  google: {
    placesApiKey: process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY,
  },
});
