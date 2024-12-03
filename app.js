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
        if (location.city == undefined) {
            location.city = await getCity(location.latitude, location.longitude);
        }
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

const GOOGLE_MAPS_API_KEY="AIzaSyCAlshhT1DTtzc_dNYRlxGvl9c_NTJOZuU";

async function getCity(lat, lng) {

    // use google map reverse geocoding api
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&&result_type=locality`;
        const response = await fetch(url);
        const data = await response.json();
        // console.log(JSON.stringify(data, null, 2));
        const city = data?.results[0]?.address_components[0]?.long_name;
        // console.log('city', city);
        return Promise.resolve(city);
    } catch (error) {
        console.error('Error fetching location:', error);
        return Promise.resolve("No city found");
    }
}