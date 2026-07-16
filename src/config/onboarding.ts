// Single place to configure the B2C welcome-popup intro video.
//
// Leave empty to show the branded placeholder. To enable the video, upload the
// file once and paste its URL here:
//   - Self-hosted file: a direct https URL to the .mp4 (recommended: the same
//     S3 bucket/CloudFront the app already uses), e.g.
//     "https://<bucket>.s3.eu-central-1.amazonaws.com/onboarding/intro.mp4"
//   - Or an embed link from YouTube/Vimeo, e.g.
//     "https://www.youtube.com/embed/XXXXXXXXXXX"
//
// A direct .mp4/.webm/.ogg URL is rendered with a native player; anything else
// is embedded via an iframe (see OnboardingModal.vue).
export const ONBOARDING_VIDEO_URL = "https://www.youtube.com/embed/zVvKCmldnBQ?rel=0";

// Optional preview image shown before a self-hosted video is played.
export const ONBOARDING_VIDEO_POSTER_URL = "";
