const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'leads_db.json');

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
});

// Production runtime memory buffer container
let activeSessionLeads = [];
let databaseInitialized = false;

const defaultSeeds = [
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

function synchronizeCoreMemory() {
    // If memory array is already active during this cycle, trust memory state
    if (databaseInitialized && activeSessionLeads.length > 0) {
        return activeSessionLeads;
    }

    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify(defaultSeeds, null, 2));
            activeSessionLeads = [...defaultSeeds];
            databaseInitialized = true;
            return activeSessionLeads;
        }
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        activeSessionLeads = JSON.parse(fileData);
        databaseInitialized = true;
        return activeSessionLeads;
    } catch (error) {
        console.error("Storage interface mismatch, fallback to defaults:", error);
        return activeSessionLeads.length > 0 ? activeSessionLeads : defaultSeeds;
    }
}

function persistCoreMemory(data) {
    try {
        activeSessionLeads = data;
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Failed writing changes to local disk block:", error);
    }
}

function parseLeadContact(text) {
    const pattern = /(?:\+91|91|0)?[6-9]\d{9}/g;
    const scrubbedText = text.replace(/\s+/g, '');
    const discovered = scrubbedText.match(pattern);
    
    if (discovered) {
        let cleanNum = discovered[0];
        if (!cleanNum.startsWith('+91') && cleanNum.length === 10) {
            cleanNum = '+91' + cleanNum;
        }
        return cleanNum;
    }
    return null;
}

// --- CORE API INTERFACES ---

app.get('/api/leads', (req, res) => {
    const records = synchronizeCoreMemory();
    res.json(records);
});

app.post('/api/ingest', (req, res) => {
    const { name, source, location, detail } = req.body;
    
    if (!detail) {
        return res.status(400).json({ error: "Missing required detail content properties." });
    }

    const isolatedContact = parseLeadContact(detail);
    const currentRecords = synchronizeCoreMemory();
    
    const structuredEntry = {
        id: Date.now(),
        name: name ? name.trim() : "Anonymous User",
        source: source ? source.trim() : "Web Stream Engine",
        location: location ? location.trim() : "Mumbai Transit Corridor",
        detail: detail.trim(),
        contact: isolatedContact || "PENDING_AUTO_REACH",
        status: isolatedContact ? "CONTACT_READY" : "AUTO_OUTREACH_ACTIVE"
    };

    currentRecords.unshift(structuredEntry);
    persistCoreMemory(currentRecords);
    
    res.status(201).json(structuredEntry);
});

app.listen(PORT, () => {
    console.log(`Infinity Production Network Online Engine Live on Port ${PORT}`);
});
