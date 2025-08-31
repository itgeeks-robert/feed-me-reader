import type { Settings } from '../App';

// Fix for TypeScript errors: Cannot find name 'gapi' and cannot find namespace 'google'.
declare const gapi: any;
// Fix: Replaced `declare const google: any;` with a proper `declare namespace google` to fix "Cannot find namespace 'google'" TypeScript errors.
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        error?: string;
        [key: string]: any;
      }
      interface TokenClient {
        requestAccessToken: (options: { prompt: string }) => void;
      }
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (tokenResponse: TokenResponse) => void;
      }): TokenClient;
      function revoke(token: string, callback: () => void): void;
    }
  }
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const SETTINGS_FILE_NAME = 'feedme_settings.json';

if (!GOOGLE_CLIENT_ID) {
    console.error("CRITICAL: GOOGLE_CLIENT_ID is not set in your .env file. Google Sign-In will not work.");
}
if (!GOOGLE_API_KEY) {
    console.error("CRITICAL: GOOGLE_API_KEY is not set in your .env file. Google Drive sync may not work.");
}


export interface GoogleUserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

// Promise to wait for the GAPI script to load and initialize the client library.
// This is more robust than the previous setInterval implementation.
const gapiReady = new Promise<void>((resolve, reject) => {
    const checkGapi = () => {
        if (typeof gapi !== 'undefined' && gapi.load) {
            // Use the built-in callback and error handling for gapi.load
            gapi.load('client', {
                callback: resolve,
                onerror: () => reject(new Error('GAPI client failed to load.')),
                timeout: 5000,
                ontimeout: () => reject(new Error('GAPI client load timed out.')),
            });
        } else {
            // Poll for the gapi object itself if the script hasn't loaded yet.
            setTimeout(checkGapi, 100);
        }
    };
    checkGapi();
});

// Promise to wait for the Google Identity Services (GIS) script to load.
const gisReady = new Promise<void>((resolve) => {
    const checkGis = () => {
        if (typeof google !== 'undefined' && google.accounts) {
            resolve();
        } else {
            setTimeout(checkGis, 100);
        }
    };
    checkGis();
});

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let onAuthChangeCallback: ((token: google.accounts.oauth2.TokenResponse | null) => void) | null = null;
let fileId: string | null = null;

const GoogleDriveService = {
    async initClient(callback: (token: google.accounts.oauth2.TokenResponse | null) => void): Promise<void> {
        onAuthChangeCallback = callback;
        
        if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
            console.error("Google Drive Service initialization skipped due to missing API keys.");
            return;
        }

        // Wait for both Google libraries to be loaded and ready.
        await Promise.all([gapiReady, gisReady]);

        // Now that the gapi client library is loaded, we can initialize it.
        await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            discoveryDocs: [DISCOVERY_DOC],
        });

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse) => {
                if (tokenResponse.error) {
                    console.error('Google Auth Error:', tokenResponse.error);
                    onAuthChangeCallback?.(null);
                    return;
                }
                gapi.client.setToken(tokenResponse);
                onAuthChangeCallback?.(tokenResponse);
            },
        });
    },

    signIn() {
        if (tokenClient) {
            if (gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                tokenClient.requestAccessToken({ prompt: '' });
            }
        } else {
            console.error('Google Auth client not initialized.');
        }
    },

    signOut() {
        const token = gapi.client.getToken();
        if (token) {
            google.accounts.oauth2.revoke(token.access_token, () => {
                gapi.client.setToken(null);
                fileId = null;
                onAuthChangeCallback?.(null);
            });
        }
    },
    
    async getSignedInUser(): Promise<GoogleUserProfile> {
         const response = await gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });
        const profile = JSON.parse(response.body);
        return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
        };
    },

    async findOrCreateFile(): Promise<string> {
        if (fileId) return fileId;

        const response = await gapi.client.drive.files.list({
            q: `name='${SETTINGS_FILE_NAME}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)',
        });
        
        if (response.result.files && response.result.files.length > 0) {
            fileId = response.result.files[0].id!;
            return fileId;
        }

        const createResponse = await gapi.client.drive.files.create({
            resource: {
                name: SETTINGS_FILE_NAME,
                parents: ['root'],
            },
            fields: 'id',
        });
        
        fileId = createResponse.result.id!;
        return fileId;
    },

    async uploadSettings(settings: Settings): Promise<void> {
        const currentFileId = await this.findOrCreateFile();
        const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify({ name: SETTINGS_FILE_NAME })], { type: 'application/json' }));
        formData.append('file', settingsBlob);

        await gapi.client.request({
            path: `/upload/drive/v3/files/${currentFileId}`,
            method: 'PATCH',
            params: { uploadType: 'media' },
            body: settingsBlob,
        });
    },

    async downloadSettings(): Promise<Settings | null> {
        try {
            const currentFileId = await this.findOrCreateFile();
            const response = await gapi.client.drive.files.get({
                fileId: currentFileId,
                alt: 'media',
            });
            
            if(response.body && response.body.length > 0) {
                 return JSON.parse(response.body) as Settings;
            }
            return null;

        } catch (error: any) {
            // A 404 probably just means the file doesn't exist yet, which is fine.
            if (error.status === 404) {
                 console.log("Settings file not found. A new one will be created.");
                 fileId = null; // Reset fileId so findOrCreateFile will create a new one
                 return null;
            }
            console.error('Error downloading settings:', error);
            throw error;
        }
    },
};

export default GoogleDriveService;