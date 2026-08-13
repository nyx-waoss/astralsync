//calculate.js
import { Origin, Horoscope } from "circular-natal-horoscope-js";

const PLANETAS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const info = JSON.parse(event.body);

        const { lat, lon } = await geocodificar(info.city, info.country);

        const [year, month, date] = info.birthdate.split('-').map(Number);

        const horaDesconocida = info.birthtime === 'Unknown';
        let hour = 12, minute = 0;

        if (!horaDesconocida) {
            [hour, minute] = info.birthtime.split(':').map(Number);
        }

        const origin = new Origin({
            year,
            month: month - 1,
            date,
            hour,
            minute,
            latitude: lat,
            longitude: lon,
        });

        const horoscope = new Horoscope({
            origin,
            houseSystem: 'placidus',
            zodiac: 'tropical',
            aspectPoints: ['bodies', 'angles'],
            aspectWithPoints: ['bodies', 'angles'],
            aspectTypes: ['major'],
            customOrbs: {},
            language: 'es',
        });

        const planetas = {};
        PLANETAS.forEach(key => {
            const body = horoscope.CelestialBodies[key];
            planetas[key] = {
                nombre: body.label,
                signo: body.Sign.label,
                casa: body.House.id,
                retrogrado: !!body.isRetrograde,
            };
        });

        const resultado = {
            ascendente: horoscope.Ascendant.Sign.label,
            mc: horoscope.Midheaven.Sign.label,
            planetas,
            horaDesconocida,
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resultado),
        };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
}

async function geocodificar(city, country) {
    const query = encodeURIComponent(`${city}, ${country}`);
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'User-Agent': 'CartaNatalApp/1.0 (galletamelendez5@gmail.com)' } }
    );

    const data = await res.json();
    if (!data.length) throw new Error(`No se encontró la ubicación: ${city}, ${country}`);

    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}