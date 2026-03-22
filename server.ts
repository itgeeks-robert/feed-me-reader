
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // The redirect URI will be constructed dynamically in the request
);

async function startServer() {
    const app = express();
    app.use(cookieParser());
    app.use(express.json());

    // API Routes
    app.get('/api/auth/device/code', async (req, res) => {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.status(412).json({ 
                error: 'MISSING_CREDENTIALS',
                message: 'Google OAuth credentials not configured in environment.' 
            });
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/device/code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    scope: [
                        'https://www.googleapis.com/auth/youtube.readonly',
                        'https://www.googleapis.com/auth/userinfo.profile',
                        'https://www.googleapis.com/auth/userinfo.email'
                    ].join(' ')
                })
            });

            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error('Device code error:', error);
            res.status(500).json({ error: 'Failed to get device code' });
        }
    });

    app.post('/api/auth/device/poll', async (req, res) => {
        const { device_code } = req.body;
        if (!device_code) return res.status(400).json({ error: 'No device code' });

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID!,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                    device_code,
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                })
            });

            const data = await response.json();

            if (data.access_token) {
                // Success! Set tokens in cookie
                res.cookie('youtube_tokens', JSON.stringify(data), {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
                });
                return res.json({ success: true });
            }

            res.json(data); // Return error status (e.g., authorization_pending)
        } catch (error) {
            console.error('Polling error:', error);
            res.status(500).json({ error: 'Polling failed' });
        }
    });

    app.get('/api/auth/url', (req, res) => {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.status(412).json({ 
                error: 'MISSING_CREDENTIALS',
                message: 'Google OAuth credentials not configured in environment.' 
            });
        }

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['host'];
        const redirectUri = `${protocol}://${host}/auth/callback`;

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/youtube.readonly',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            redirect_uri: redirectUri,
            prompt: 'consent'
        });

        res.json({ url });
    });

    app.get('/auth/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).send('No code provided');

        try {
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.headers['host'];
            const redirectUri = `${protocol}://${host}/auth/callback`;

            const { tokens } = await oauth2Client.getToken({
                code: code as string,
                redirect_uri: redirectUri
            });

            // Set tokens in a secure cookie
            res.cookie('youtube_tokens', JSON.stringify(tokens), {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            // Send success message to parent window and close popup
            res.send(`
                <html>
                    <body style="background: #000; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh;">
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                                window.close();
                            } else {
                                window.location.href = '/';
                            }
                        </script>
                        <div style="text-align: center;">
                            <h1 style="color: #ff0000;">VOIDTUBE_AUTH_SUCCESS</h1>
                            <p>SIGNAL_ESTABLISHED. CLOSING_UPLINK...</p>
                        </div>
                    </body>
                </html>
            `);
        } catch (error) {
            console.error('OAuth error:', error);
            res.status(500).send('Authentication failed');
        }
    });

    app.get('/api/auth/status', async (req, res) => {
        const tokensCookie = req.cookies['youtube_tokens'];
        if (!tokensCookie) return res.json({ loggedIn: false });

        try {
            const tokens = JSON.parse(tokensCookie);
            oauth2Client.setCredentials(tokens);
            
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();

            res.json({ 
                loggedIn: true, 
                user: {
                    name: userInfo.data.name,
                    picture: userInfo.data.picture,
                    email: userInfo.data.email
                }
            });
        } catch (error) {
            res.json({ loggedIn: false });
        }
    });

    app.post('/api/auth/logout', (req, res) => {
        res.clearCookie('youtube_tokens', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        res.json({ success: true });
    });

    app.get('/api/youtube/trending', async (req, res) => {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey && !req.cookies['youtube_tokens']) {
            return res.status(412).json({ error: 'No API Key or Auth' });
        }

        try {
            let auth: any = apiKey;
            if (req.cookies['youtube_tokens']) {
                const tokens = JSON.parse(req.cookies['youtube_tokens']);
                oauth2Client.setCredentials(tokens);
                auth = oauth2Client;
            }

            const youtube = google.youtube({ version: 'v3', auth });
            const response = await youtube.videos.list({
                part: ['snippet', 'statistics', 'contentDetails'],
                chart: 'mostPopular',
                maxResults: 20,
                regionCode: 'US' // Could be dynamic
            });

            const videos = response.data.items?.map(item => ({
                id: item.id,
                title: item.snippet?.title,
                thumbnail: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url,
                author: item.snippet?.channelTitle,
                views: `${parseInt(item.statistics?.viewCount || '0').toLocaleString()} views`,
                published: item.snippet?.publishedAt,
                category: 'Trending'
            })) || [];

            res.json(videos);
        } catch (error) {
            console.error('Trending fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch trending videos' });
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
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
