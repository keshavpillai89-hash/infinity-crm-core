const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Path to our permanent cloud storage backup file
const DB_FILE = path.join(__dirname, 'leads_db.json');

app.use(express.json());

// Enable cross-origin resource sharing for flawless independent device sync
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
});

// Helper: Safely reads records from the permanent disk file
function readDatabase() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            // Seed defaults if the file doesn't exist yet
            const defaults = [
                {
                    id: 1,
                    name: "Vikram Malhotra",
                    source: "Facebook - Flats Andheri West",
                    location: "Andheri West",
                    detail: "Looking for an urgent 2BHK rental flat setup near the metro rail track. Budget is around 62k maximum. Contact +91 9876543210",
                    contact: "+919876543210",
                    status: "CONTACT_READY"
                },
                {
                    id: 2,
                    name: "Aditi G. (Owner)",
                    source: "Instagram - Direct Tag Parsing",
                    location: "Goregaon East",
                    detail: "Want to rent out my fully furnished 1BHK apartment in Goregaon East right away. Send DM for configurations.",
                    contact: "PENDING_AUTO_REACH",
                    status: "AUTO_OUTREACH_ACTIVE"
                }
            ];
            fs.writeFileSync(DB_FILE, JSON.stringify(defaults, null, 2));
            return defaults;
        }
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(fileData);
    } catch (error) {
        console.error("Database reading breakdown, falling back to empty array:", error);
        return [];
    }
}

// Helper: Writes records back safely to the permanent disk file
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Critical error saving data packets to disk database:", error);
    }
}

// Phone parsing engine: Extracts digits and strips confusing spacing
function parseLeadContact(text) {
    // Looks for Indian formats (+91, 91, 0, or raw 10 digits with spaces/dashes hidden)
    const pattern = /(?:\+91|91|0)?[6-9]\d{9}/g;
    
    // First remove casual internal spaces within the text to catch numbers written like "98765 43210"
    const scrubbedText = text.replace(/\s+/g, '');
    const discovered = scrubbedText.match(pattern);
    
    if (discovered) {
        let cleanNum = discovered[0];
        // Ensure standard string initialization for the client phone dialer
        if (!cleanNum.startsWith('+91') && cleanNum.length === 10) {
            cleanNum = '+91' + cleanNum;
        }
        return cleanNum;
    }
    return null;
}

// --- API ROUTES ---

// 1. Fetch Pipeline Stream (Called continuously by your phone and laptop)
app.get('/api/leads', (req, res) => {
    const records = readDatabase();
    res.json(records);
});

// 2. Ingest Stream (Receives new leads from automated scrapers OR your phone entry form)
app.post('/api/ingest', (req, res) => {
    const { name, source, location, detail } = req.body;
    
    if (!detail) {
        return res.status(400).json({ error: "Missing required detail content properties." });
    }

    const isolatedContact = parseLeadContact(detail);
    const currentRecords = readDatabase();
    
    const structuredEntry = {
        id: Date.now(),
        name: name ? name.trim() : "Anonymous User",
        source: source ? source.trim() : "Web Stream Engine",
        location: location ? location.trim() : "Mumbai Transit Corridor",
        detail: detail.trim(),
        contact: isolatedContact || "PENDING_AUTO_REACH",
        status: isolatedContact ? "CONTACT_READY" : "AUTO_OUTREACH_ACTIVE"
    };

    // Push the newest lead directly to the top of the pile
    currentRecords.unshift(structuredEntry);
    writeDatabase(currentRecords);
    
    res.status(201).json(structuredEntry);
});

app.listen(PORT, () => {
    console.log(`Infinity Production Network Online Engine Live on Port ${PORT}`);
});
