# IconGenius

IconGenius is an AI-powered icon generator that allows users to create stunning icons from text descriptions using Google's Gemini API.

## Features

- **AI Icon Generation**: Generate high-quality icons from text prompts.
- **Prompt Enhancement**: Automatically refine prompts for better results.
- **Icon Library**: Save and manage your generated icons.
- **Full-Stack Application**: Built with Express + Vite to securely handle backend logic.

## Google Integration

This application features a full-stack Express + Vite architecture to securely handle OAuth and Google Drive API interactions.

### Google Authentication
Users can log in with their Google account. The OAuth flow uses a secure popup window and stores authentication tokens in an `httpOnly` cookie for enhanced security.

### Google Drive Integration
- **Save**: Generated icons are saved as PNG files in a dedicated "IconGenius Library" folder on the user's Google Drive.
- **List**: The library view fetches icons directly from this Google Drive folder, ensuring users see their saved icons across sessions and devices.

## Environment Setup

The following environment variables are required for Google integration. These have been added to `.env.example`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_URL`

## Configuration Guide

To enable the Google Drive features, you must configure Google OAuth credentials:

1.  **Google Cloud Console**: Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create Project**: Create a new project or select an existing one.
3.  **Enable API**: Enable the **Google Drive API** for your project.
4.  **Configure OAuth Consent Screen**: Set up the OAuth consent screen (External or Internal depending on your needs).
5.  **Create Credentials**:
    -   Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
    -   Select **Web application**.
    -   Add your application's URL to **Authorized JavaScript origins**.
    -   Add the redirect URI to **Authorized redirect URIs**:
        ```
        <YOUR_APP_URL>/auth/callback
        ```
        (e.g., `https://your-app-id.run.app/auth/callback` or `http://localhost:3000/auth/callback` for local development).
6.  **Set Environment Variables**:
    -   Copy the **Client ID** and **Client Secret**.
    -   Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment variables.
    -   Set `APP_URL` to your application's root URL.

## Usage

1.  **Login**: Click the "Login with Google" button in the top right corner.
2.  **Generate**: Enter a prompt and generate an icon.
3.  **Save**: Click "Save to Drive" to upload the icon to your Google Drive.
4.  **Library**: View your saved icons in the library section below.
