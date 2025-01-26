import express, { response } from 'express';
import { lookup, reload } from 'ip-location-api';

const app = express();
const PORT = 8087;
import 'dotenv/config'

const GOOGLE_MAPS_API_KEY=process.env.GOOGLE_MAPS_API_KEY ;
const DEFAULT_LOCATION = { latitude: 40.730610, longitude: -73.935242, country: 'US', region1_name: 'Unknown', city: 'Unknown' };
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

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api/location/:ip', async (req, res) => {

    var startTime = new Date();
    var responseJson = {};
    const ip = req.params.ip;
    try {
        const location = await lookup(ip);
        // console.log(JSON.stringify(location, null, 2));
        if (location == null || location.latitude == undefined || location.longitude == undefined) {
            responseJson = DEFAULT_LOCATION;
        } else {
            if (location?.city == undefined) {
                location.city = await getCity(location.latitude, location.longitude);
            }
            responseJson = location;
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        responseJson = DEFAULT_LOCATION;

    } finally {
        var endTime = new Date();
        var responseTime = endTime - startTime;
        responseJson.responseTimeMs = responseTime;
        res.json(responseJson);
    }
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    //console.log(GOOGLE_MAPS_API_KEY);
    await reload({fields: 'latitude,longitude,country,country_name,region1_name,city'});
});


async function getCity(lat, lng) {

    // use google map reverse geocoding api
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        // console.log(JSON.stringify(data, null, 2));
        for (const result of data.results) {
            for (const component of result.address_components) {
                if (component.types.includes('locality')) {
                    var city = component.long_name;
                    console.log('city (from Google Maps): ', city);
                    return city;
                }
            }    
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        return "Unknown";
    }

}