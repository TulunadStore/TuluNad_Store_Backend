// tulunad-backend/googleDriveConfig.js
require('dotenv').config();
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
// It's good practice to have a valid REDIRECT_URI, even if only for backend use with refresh token.
// If you have a frontend login flow, this should match your Google OAuth callback URL.
// Otherwise, a placeholder like the one below is fine.
const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5000/oauth2callback';
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});

module.exports = { drive, oauth2Client };