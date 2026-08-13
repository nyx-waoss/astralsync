const $ = (el) => document.getElementById(el);

//document.body.classList.add('showdot');

console.log('start');
setInterval(() => {
    document.body.classList.add('showdot');
}, 5000);

setTimeout(() => {
    setInterval(() => {
        document.body.classList.remove('showdot');
    }, 5000);
}, 2500);

setTimeout(() => {
    $('page_home').classList.add('visible');
}, 600);





function openAboutDialog() {
    $('abaoutapp').classList.remove('hide');
}
function closeAboutDialog() {
    $('abaoutapp').classList.add('hide');
}




function showForm() {
    $('page_home').classList.add('left');
    $('page_form').classList.remove('right');
}

function hideForm() {
    $('page_home').classList.remove('left');
    $('page_form').classList.add('right');
}



function showLoading() {
    $('page_form').classList.add('left');
    $('page_load').classList.remove('right');
}
function showPositions() {
    $('page_load').classList.add('left');
    $('page_positions').classList.remove('right');
}

function showResults() {
    $('page_positions').classList.add('left');
    $('page_results').classList.remove('right');
}




const selectCountry = $('dp_country');
const selectCity    = $('dp_city');

let countryData = [];

fetch('https://countriesnow.space/api/v0.1/countries/states').then(res => res.json()).then(ans => {
    countryData = ans.data;
    selectCountry.innerHTML = " <option value=''>Selecciona un pais</option> ";
    countryData.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        opt.textContent = item.name;
        selectCountry.appendChild(opt);
    });
}).catch(err => {
    console.error('Error when loading Countries', err);
    selectCountry.innerHTML = " <option value=''>Error al cargar la lista...</option> ";
});

selectCountry.addEventListener('change', () => {
    const selectedCountry = selectCountry.value;

    selectCity.innerHTML = " <option value=''>Selecciona un estado</option> ";

    if (!selectedCountry) {
        selectCity.disabled = true;
        return;
    }

    const infoCountry = countryData.find(p => p.name === selectedCountry);
    if (infoCountry && infoCountry.states.length > 0) {
        infoCountry.states.forEach(state => {
            const opt = document.createElement('option');
            opt.value = state.name;
            opt.textContent = state.name;
            selectCity.appendChild(opt);
        });
        selectCity.disabled = false;
    } else {
        selectCity.innerHTML = " <option value=''>No hay estados</option> ";
        selectCity.disabled = true;
    }
});


function createInfoObject() {
    const infobj = {};

    infobj.name = $('fname').value;
    infobj.birthdate = String($('fbirth').value);

    if ($('funknownfbhour').checked) {
        infobj.birthtime = "Unknown";
    } else {
        infobj.birthtime = String($('fbhour').value);
    }

    infobj.country = $('dp_country').value;
    infobj.city = $('dp_city').value;
    infobj.favoritecolor = $('dp_favcolor').value;
    infobj.favoritenumber = String($('ffavnum').value);
    infobj.defineword = $('fdefword').value;
    infobj.definetext = $('fperdef').value;

    infobj.range_introversion_to_extroversion = $('range_social').value;
    infobj.range_order_to_chaos = $('range_chaos').value;
    infobj.range_sleep_schedule = $('range_sleep').value;

    return infobj;
}



async function generarCartaNatal() {
    const info = createInfoObject();
    showLoading();

    try {
        const res = await fetch('/.netlify/functions/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(info),
        });

        if (!res.ok) throw new Error('Error calculando las posiciones');

        const posiciones = await res.json();

        mostrarPosiciones(posiciones);
        showPositions();

        window._infoNatal = info;
        window._posicionesNatal = posiciones;

    } catch (err) {
        console.error(err);
        alert(err);
    }
}

function mostrarPosiciones(pos) {
    $('pos-ascendente').textContent = pos.ascendente;
    $('pos-mc').textContent = pos.mc;

    const nombres = { sun:'Sol', moon:'Luna', mercury:'Mercurio', venus:'Venus', mars:'Marte',
                       jupiter:'Júpiter', saturn:'Saturno', uranus:'Urano', neptune:'Neptuno', pluto:'Plutón' };

    for (const key in pos.planetas) {
        const p = pos.planetas[key];
        const el = $(`pos-${key}`);
        if (el) el.textContent = `${p.signo} · Casa ${p.casa}${p.retrogrado ? ' (Retrógrado)' : ''}`;
    }

    if (pos.horaDesconocida) {
        $('pos-aviso').textContent = 'Como no diste la hora exacta, el Ascendente, el Medio Cielo, las Casas y la Luna son aproximados.';
        $('pos-aviso').classList.remove('hide');
    } else {
        $('pos-aviso').classList.add('hide');
    }
}

async function generarInterpretacionIA() {
    showLoading();

    try {
        const res = await fetch('/.netlify/functions/generatent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                info: window._infoNatal,
                posiciones: window._posicionesNatal,
            }),
        });

        if (!res.ok) throw new Error('Error when generating');

        const { seccion1, seccion2, seccion3 } = await res.json();

        $('resultado-seccion1').textContent = seccion1;
        $('resultado-seccion2').textContent = seccion2;
        $('resultado-seccion3').textContent = seccion3;

        showResults();
    } catch (err) {
        console.error(err);
        alert(err);
    }
}



//