import dotenv from 'dotenv';

dotenv.config();

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
  },
  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  },
  app: {
    port: process.env.PORT || 8080,
    mentorChannelId: process.env.MENTOR_CHANNEL_ID,
  },
};
