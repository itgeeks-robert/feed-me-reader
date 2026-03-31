import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';

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
    app.get('/api/auth/device/code', async (_req, res) => {
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

    app.post('/api/auth/logout', (_req, res) => {
        res.clearCookie('youtube_tokens', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        res.json({ success: true });
    });

    app.get('/api/youtube/trending', async (req, res) => {
        const apiKey = process.env.GOOGLE_API_KEY;
        
        // If we have an official API key, use it. Otherwise, "piggyback" on InnerTube (Guest Mode)
        if (apiKey) {
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
                    regionCode: 'US'
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

                return res.json(videos);
            } catch (error) {
                console.error('Official API fetch error, falling back to InnerTube:', error);
            }
        }

        // InnerTube "Piggyback" Mode (No API Key required)
        try {
            // Fetch YouTube homepage to extract the INNERTUBE_API_KEY
            const ytResponse = await fetch('https://www.youtube.com/');
            const ytHtml = await ytResponse.text();
            const match = ytHtml.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
            const INNERTUBE_API_KEY = match ? match[1] : '';

            if (!INNERTUBE_API_KEY) {
                throw new Error('Could not extract INNERTUBE_API_KEY from YouTube homepage');
            }
            
            const response = await fetch('https://www.youtube.com/youtubei/v1/browse?key=' + INNERTUBE_API_KEY, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Origin': 'https://www.youtube.com',
                    'Referer': 'https://www.youtube.com/'
                },
                body: JSON.stringify({
                    context: {
                        client: {
                            clientName: 'WEB',
                            clientVersion: '2.20210622.10.00',
                            hl: 'en',
                            gl: 'US',
                            utcOffsetMinutes: 0
                        }
                    },
                    browseId: 'UC4R8DWoMoI7CAwX8_LjQHig' // YouTube Trending Channel ID
                })
            });

            if (!response.ok) {
                throw new Error(`InnerTube API responded with ${response.status}`);
            }

            const data: any = await response.json();
            
            // Robust parser for InnerTube response
            const videos: any[] = [];
            
            // Helper to recursively find video renderers
            const findVideos = (obj: any) => {
                if (!obj || typeof obj !== 'object') return;
                
                if (obj.videoRenderer) {
                    const v = obj.videoRenderer;
                    videos.push({
                        id: v.videoId,
                        title: v.title?.runs?.[0]?.text || v.title?.simpleText,
                        thumbnail: v.thumbnail?.thumbnails?.slice(-1)[0]?.url,
                        author: v.longBylineText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text,
                        views: v.shortViewCountText?.simpleText || v.viewCountText?.simpleText,
                        published: v.publishedTimeText?.simpleText,
                        category: 'Trending'
                    });
                    return;
                }
                
                Object.values(obj).forEach(val => findVideos(val));
            };

            findVideos(data);

            if (videos.length === 0) {
                console.log('InnerTube parsing returned empty, using mock fallback');
                return res.status(412).json({ error: 'InnerTube parsing failed' });
            }

            // Remove duplicates and limit to 20
            const uniqueVideos = Array.from(new Map(videos.map(v => [v.id, v])).values());
            res.json(uniqueVideos.slice(0, 20));
        } catch (error) {
            console.error('InnerTube fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch trending videos via InnerTube' });
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
        app.get('*all', (_req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
