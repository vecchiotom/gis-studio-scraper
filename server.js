const express = require('express');
const fs = require('fs');
const path = require('path');
const getDocuments = require('./app');

const app = express();
const PORT = 3000;
const DOCUMENTS_FILE = path.join(__dirname, 'documents.json');

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (if needed in the future)
app.use(express.static(path.join(__dirname, 'public')));


// Updated endpoint to get documents dynamically
app.get('/api/documents', async (req, res) => {
    const { code, username, password, userType } = req.query;

    if (!code || !username || !password || !userType) {
        return res.status(400).json({ error: 'All credentials (code, username, password, userType) are required in the query parameters.' });
    }

    const result = await getDocuments(code, username, password, userType);

    if (!result.success) {
        return res.status(500).json({ error: result.message });
    }

    res.json(result.data);
});

// Serve the single-page website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
