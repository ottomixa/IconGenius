import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

  // OAuth Configuration
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // Redirect URI will be constructed dynamically based on the request host
    // or use process.env.APP_URL if available
    process.env.APP_URL ? `${process.env.APP_URL}/auth/callback` : undefined
  );

  // Helper to get OAuth client for a request
  const getClient = (req: express.Request) => {
    const redirectUri = process.env.APP_URL 
      ? `${process.env.APP_URL}/auth/callback`
      : `${req.protocol}://${req.get('host')}/auth/callback`;
    
    // Create a new client instance to avoid race conditions with redirect_uri
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    return client;
  };

  // API Routes

  // 1. Get Auth URL
  app.get('/api/auth/url', (req, res) => {
    const client = getClient(req);
    const scopes = [
      'https://www.googleapis.com/auth/drive.file', // Only access files created by this app
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent to get refresh token
    });

    res.json({ url });
  });

  // 2. Auth Callback
  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).send('Missing code');
    }

    try {
      const client = getClient(req);
      const { tokens } = await client.getToken(code);
      
      // Store tokens in httpOnly cookie
      res.cookie('auth_token', JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Send success message to parent window (popup)
      res.send(`
        <html>
          <head>
            <title>Auth Success</title>
            <style>
              body { background: #18181b; color: #e4e4e7; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #27272a; padding: 2rem; border-radius: 12px; border: 1px solid #3f3f46; text-align: center; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
              h2 { margin-top: 0; color: #fff; margin-bottom: 0.5rem; }
              p { color: #a1a1aa; margin-bottom: 1.5rem; line-height: 1.5; }
              button { background: #4f46e5; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s; font-size: 0.875rem; }
              button:hover { background: #4338ca; }
            </style>
          </head>
          <body>
            <div class="card">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; display: inline-block;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h2>Authentication Successful</h2>
              <p>You have successfully logged in. You can now close this window and return to IconGenius.</p>
              <button onclick="window.close()">Close Window</button>
            </div>
            <script>
              // Notify the opener
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                // Attempt to close automatically after a brief delay
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // 3. Get User Info (Check if logged in)
  app.get('/api/auth/me', async (req, res) => {
    const tokenStr = req.cookies.auth_token;
    if (!tokenStr) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const tokens = JSON.parse(tokenStr);
      const client = getClient(req);
      client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const userInfo = await oauth2.userinfo.get();

      res.json(userInfo.data);
    } catch (error) {
        // If token is invalid, clear cookie
        res.clearCookie('auth_token');
        res.status(401).json({ error: 'Invalid token' });
    }
  });

  // 4. Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ success: true });
  });

  // 5. Save Icon to Drive
  app.post('/api/drive/save', async (req, res) => {
    const tokenStr = req.cookies.auth_token;
    if (!tokenStr) return res.status(401).json({ error: 'Not authenticated' });

    const { name, base64Data, mimeType } = req.body;
    if (!name || !base64Data) return res.status(400).json({ error: 'Missing data' });

    try {
      const tokens = JSON.parse(tokenStr);
      const client = getClient(req);
      client.setCredentials(tokens);

      const drive = google.drive({ version: 'v3', auth: client });

      // Check if folder exists, create if not
      let folderId = '';
      const folderName = 'IconGenius Library';
      
      const folderSearch = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id!;
      } else {
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        };
        const folder = await drive.files.create({
          requestBody: folderMetadata,
          fields: 'id'
        });
        folderId = folder.data.id!;
      }

      // Upload file
      const buffer = Buffer.from(base64Data, 'base64');
      const stream = fs.createReadStream('/tmp/temp_image'); // Dummy path, we'll use buffer
      
      // We need a readable stream from buffer
      const { Readable } = await import('stream');
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);

      const fileMetadata = {
        name: name,
        parents: [folderId],
        appProperties: {
            app: 'IconGenius',
            type: 'icon'
        }
      };
      
      const media = {
        mimeType: mimeType || 'image/png',
        body: readable
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webContentLink, webViewLink, thumbnailLink'
      });

      res.json(file.data);

    } catch (error) {
      console.error('Drive upload error:', error);
      res.status(500).json({ error: 'Failed to upload to Drive' });
    }
  });

  // 6. List Icons from Drive
  app.get('/api/drive/list', async (req, res) => {
    const tokenStr = req.cookies.auth_token;
    if (!tokenStr) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const tokens = JSON.parse(tokenStr);
      const client = getClient(req);
      client.setCredentials(tokens);

      const drive = google.drive({ version: 'v3', auth: client });

      // Find our folder first
      const folderName = 'IconGenius Library';
      const folderSearch = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive'
      });

      if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
        return res.json([]); // No folder means no icons
      }

      const folderId = folderSearch.data.files[0].id;

      // List files in folder
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false and mimeType contains 'image/'`,
        fields: 'files(id, name, webContentLink, webViewLink, thumbnailLink, createdTime, appProperties)',
        orderBy: 'createdTime desc',
        pageSize: 100
      });

      // Transform to IconData format (as best as we can)
      // Note: We don't store the prompt in Drive metadata by default unless we add it to description or properties.
      // For now, we'll just return the file info and maybe fetch the content if needed, 
      // but fetching content for all files might be slow.
      // Ideally, we store the prompt in 'description' or 'appProperties'.
      
      const files = response.data.files || [];
      res.json(files);

    } catch (error) {
      console.error('Drive list error:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });
  
  // 7. Get File Content (Proxy to avoid CORS issues with Drive links sometimes)
  app.get('/api/drive/file/:fileId', async (req, res) => {
      const tokenStr = req.cookies.auth_token;
      if (!tokenStr) return res.status(401).json({ error: 'Not authenticated' });
      
      try {
          const tokens = JSON.parse(tokenStr);
          const client = getClient(req);
          client.setCredentials(tokens);
          
          const drive = google.drive({ version: 'v3', auth: client });
          const fileId = req.params.fileId;
          
          const response = await drive.files.get({
              fileId: fileId,
              alt: 'media'
          }, { responseType: 'stream' });
          
          response.data
            .on('end', () => {
                // Done
            })
            .on('error', (err) => {
                console.error('Error streaming file', err);
                res.status(500).end();
            })
            .pipe(res);
            
      } catch (error) {
          console.error('Error fetching file content:', error);
          res.status(500).json({ error: 'Failed to fetch file' });
      }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
