import express from 'express';
import { lookup, reload } from 'ip-location-api';

const app = express();
const PORT = 8087;

app.use((req, res, next) => {
    const { method, url } = req;
    const timestamp = new Date().toISOString();
    
    //console.log(`[${timestamp}] ${method} ${url}`);
    
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`[${timestamp}] ${method} ${url} Response: ${body}`);
        originalSend.call(this, body); 
    };

    next();
});

app.get('/api/location/:ip', async (req, res) => {
    const ip = req.params.ip;
    try {
        const location = await lookup(ip);
        res.json(location);
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({ error: 'Error fetching location' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    await reload({fields: 'latitude,longitude,country,country_name,region1_name,city'})
});