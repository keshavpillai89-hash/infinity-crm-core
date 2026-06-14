const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable cross-origin resource sharing for independent terminal access
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Primary memory database array holding live property data
let systemLeads = [
    {
        id: 1,
        name: "Vikram Malhotra",
        source: "Facebook - Flats Andheri West",
        location: "Andheri West",
        detail: "Looking for an urgent 2BHK rental flat setup near the metro rail track. Budget is around 62k maximum. Contact +91 9876543210",
        contact: "+91 9876543210",
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

// Context extraction helper function
function parseLeadContact(text) {
    const pattern = /(?:\+91|0)?[6-9]\d{9}/g;
    const discovered = text.match(pattern);
    return discovered ? discovered[0] : null;
}

// API Routes
app.get('/api/leads', (req, res) => {
    res.json(systemLeads);
});

app.post('/api/ingest', (req, res) => {
    const { name, source, location, detail } = req.body;
    
    if (!detail) {
        return res.status(400).json({ error: "Missing required detail content properties." });
    }

    const isolatedContact = parseLeadContact(detail);
    
    const structuredEntry = {
        id: Date.now(),
        name: name || "Anonymous User",
        source: source || "Web Stream Engine",
        location: location || "Mumbai Transit Corridor",
        detail: detail,
        contact: isolatedContact || "PENDING_AUTO_REACH",
        status: isolatedContact ? "CONTACT_READY" : "AUTO_OUTREACH_ACTIVE"
    };

    systemLeads.unshift(structuredEntry);
    res.status(201).json(structuredEntry);
});

app.listen(PORT, () => {
    console.log(`Infinity Production Network Online Engine Live on Port ${PORT}`);
});
