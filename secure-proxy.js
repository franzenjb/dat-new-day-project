// SECURE PROXY FOR PRODUCTION USE
// This file demonstrates how to properly handle credentials server-side
// DO NOT use client-side credentials in production

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to get ArcGIS token
app.post('/api/arcgis-token', async (req, res) => {
    try {
        const tokenUrl = 'https://www.arcgis.com/sharing/rest/oauth2/token';
        const params = new URLSearchParams({
            'client_id': process.env.ARCGIS_CLIENT_ID,
            'client_secret': process.env.ARCGIS_CLIENT_SECRET,
            'grant_type': 'client_credentials'
        });
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });
        
        const data = await response.json();
        res.json({ token: data.access_token });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get token' });
    }
});

// Proxy for ArcGIS operations
app.post('/api/arcgis-proxy/*', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const featureLayerUrl = process.env.ARCGIS_FEATURE_LAYER;
        const operation = req.params[0];
        const url = `${featureLayerUrl}/${operation}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `${req.body.data}&token=${token}&f=json`
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Proxy error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Secure proxy server running on port ${PORT}`);
});

/*
DEPLOYMENT INSTRUCTIONS:
1. Deploy this server to a secure environment (Heroku, AWS, etc.)
2. Set environment variables on the server
3. Update the client code to use your server endpoints instead of direct API calls
4. Enable HTTPS and proper CORS settings
5. Add rate limiting and authentication as needed
*/