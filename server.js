const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 5000;

app.use(express.json());

// Enable CORS for all requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Function to fetch credentials from GitHub
async function fetchCredentialsFromGitHub() {
    try {
        const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        if (!token) {
            throw new Error('GitHub token not found in environment variables');
        }

        const url = 'https://api.github.com/repos/bestecomtools/credentials.json/contents/credentials.json';
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Replit-Server'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Decode base64 content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error fetching credentials from GitHub:', error);
        throw error;
    }
}

// Endpoint to get credentials
app.get('/credentials', async (req, res) => {
    try {
        const credentials = await fetchCredentialsFromGitHub();
        res.json(credentials);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch credentials',
            message: error.message 
        });
    }
});

// Endpoint to get credentials for a specific site
app.get('/credentials/:site', async (req, res) => {
    try {
        const credentials = await fetchCredentialsFromGitHub();
        const site = req.params.site;
        
        if (credentials[site]) {
            res.json(credentials[site]);
        } else {
            res.status(404).json({ 
                error: 'Site not found',
                message: `No credentials found for site: ${site}` 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch credentials',
            message: error.message 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access credentials at: http://localhost:${PORT}/credentials`);
});
