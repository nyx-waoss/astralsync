//generatent.js
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const MODEL = 'llama-3.3-70b-versatile';

  try {
    const { info, posiciones } = JSON.parse(event.body);
    const contexto = construirContextoPersonal(info);

    const [seccion1, seccion2, seccion3] = await Promise.all([
      llamarGroq(GROQ_KEY, MODEL, promptSeccion1(info, posiciones, contexto)),
      llamarGroq(GROQ_KEY, MODEL, promptSeccion2(info, posiciones, contexto)),
      llamarGroq(GROQ_KEY, MODEL, promptSeccion3(info, posiciones, contexto)),
    ]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seccion1, seccion2, seccion3 }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

async function llamarGroq(apiKey, model, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Eres un astrólogo experto que escribe interpretaciones de cartas natales en español, con un tono cálido, detallado y profesional. Nunca uses disclaimers ni digas que sos una IA.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ---------- Traductores de datos crudos a texto natural ----------

const COLORES = {
  unknown: null, red: 'Rojo', green: 'Verde', blue: 'Azul', white: 'Blanco',
  yellow: 'Amarillo', orange: 'Naranja', purple: 'Morado', pink: 'Rosa', magenta: 'Rosado/Magenta',
  cyan: 'Celeste', teal: 'Turquesa', navy: 'Azul Marino', lime: 'Verde Lima',
  gray: 'Gris', black: 'Negro', brown: 'Marrón/Café', beige: 'Beige', maroon: 'Granate/Burdeos',
  gold: 'Dorado', silver: 'Plateado', other: 'Otro',
};

function describirRango(valor, negativo, positivo) {
  const n = Number(valor) || 0;
  if (n === 0) return `punto medio entre ${negativo} y ${positivo}`;
  const intensidad = Math.abs(n) >= 7 ? 'muy' : Math.abs(n) >= 3 ? 'moderadamente' : 'levemente';
  return `${intensidad} ${n > 0 ? positivo : negativo}`;
}

function construirContextoPersonal(info) {
  const partes = [];

  if (info.favoritecolor && COLORES[info.favoritecolor]) {
    partes.push(`- Color favorito: ${COLORES[info.favoritecolor]}`);
  }
  if (info.favoritenumber) partes.push(`- Número favorito: ${info.favoritenumber}`);
  if (info.defineword) partes.push(`- Se define a sí misma/o con la palabra: "${info.defineword}"`);
  if (info.definetext) partes.push(`- Descripción personal dada por quien llenó el formulario: "${info.definetext}"`);

  partes.push(`- Sociabilidad: ${describirRango(info.range_introversion_to_extroversion, 'introvertida/o', 'extrovertida/o')}`);
  partes.push(`- Estilo de vida: ${describirRango(info.range_order_to_chaos, 'ordenada/o y estructurada/o', 'caótica/o y espontánea/o')}`);
  partes.push(`- Ritmo diario: ${describirRango(info.range_sleep_schedule, 'madrugadora/or', 'nocturna/o')}`);

  return partes.length ? partes.join('\n') : '(No se dieron datos adicionales)';
}

// ---------- Prompts ----------

function promptSeccion1(info, posiciones, contexto) {
    return `Datos de la persona: ${info.name || 'esta persona'}.

Contexto adicional sobre su personalidad (tenelo en cuenta al interpretar):
${contexto}

Ascendente: ${posiciones.ascendente}.
Medio Cielo (MC): ${posiciones.mc}.
${posiciones.horaDesconocida ? 'Nota: la hora de nacimiento es desconocida, así que el Ascendente y el MC son aproximados; acláralo brevemente en el texto.' : ''}

Escribí la sección "Interpretaciones - Ascendente, Medio Cielo, Gobernantes de la casa"
para esta persona específica, conectando la interpretación astrológica con el contexto
personal dado arriba cuando tenga sentido. Sé detallado y personalizado.`;
}

function promptSeccion2(info, posiciones, contexto) {
    const listaPlanetas = Object.values(posiciones.planetas)
        .map(p => `${p.nombre}: ${p.signo}, Casa ${p.casa}${p.retrogrado ? ' (retrógrado)' : ''}`)
        .join('\n');

    return `Datos de la persona: ${info.name || 'esta persona'}.

Contexto adicional sobre su personalidad (tenelo en cuenta al interpretar):
${contexto}

Posiciones planetarias reales:
${listaPlanetas}

Escribí la sección "Interpretaciones - Planetas en signos, Planetas en casas" cubriendo
los 10 planetas de arriba, con estas posiciones exactas (no inventes otras). Conectá la
interpretación con el contexto personal cuando aplique. Sé detallado y personalizado, no genérico.`;
}

function promptSeccion3(info, posiciones, contexto) {
    return `Datos de la persona: ${info.name || 'esta persona'}.

Contexto adicional sobre su personalidad:
${contexto}

Ascendente: ${posiciones.ascendente} | MC: ${posiciones.mc}
Sol: ${posiciones.planetas.sun.signo} | Luna: ${posiciones.planetas.moon.signo}

Escribí un resumen corto (1-2 párrafos) de la personalidad general de esta persona,
integrando tanto la astrología como el contexto personal dado, en un cierre cálido y cercano.`;
}