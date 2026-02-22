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
    -   **Authorized JavaScript origins**:
        Add the following URLs to allow the app to run in AI Studio:
        ```
        https://ais-dev-zwpnpsabt2ldwdkej7f6y2-111419205929.europe-west2.run.app
        https://ais-pre-zwpnpsabt2ldwdkej7f6y2-111419205929.europe-west2.run.app
        ```
    -   **Authorized redirect URIs**:
        Add the following callback URLs:
        ```
        https://ais-dev-zwpnpsabt2ldwdkej7f6y2-111419205929.europe-west2.run.app/auth/callback
        https://ais-pre-zwpnpsabt2ldwdkej7f6y2-111419205929.europe-west2.run.app/auth/callback
        ```
6.  **Set Environment Variables**:
    -   Copy the **Client ID** and **Client Secret**.
    -   Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment variables.
    -   Set `APP_URL` to your application's root URL.
7.  **Add Test Users** (Crucial for Development):
    -   Since your app is likely in "Testing" mode, you must explicitly add users who can log in.
    -   Go to **OAuth consent screen** > **Test users**.
    -   Click **+ ADD USERS**.
    -   Enter your email address (e.g., `otto.mixa@gmail.com`) and any other emails you want to test with.
    -   Click **SAVE**.

## Usage

1.  **Login**: Click the "Login with Google" button in the top right corner.
2.  **Generate**: Enter a prompt and generate an icon.
3.  **Save**: Click "Save to Drive" to upload the icon to your Google Drive.
4.  **Library**: View your saved icons in the library section below.
