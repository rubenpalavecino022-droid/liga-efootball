/* ================= CONFIGURACIÓN DE LA LIGA ================= */
const URL = "https://script.google.com/macros/s/AKfycby6smjhGi90TgFOyjUzgFTLSJ7eAsn19aPymEEsD2I344EqrT0lamdT8PoOPIbbNLAyDw/exec";
const PASSWORD = "1234";

// DICCIONARIO OFICIAL: Jugadores en MAYÚSCULAS y archivos de imagen en minúsculas
const TEAM_DATA = {
  "RUBEN":    { code: "ESP", flag: "españa.png" },
  "GONZALO":  { code: "BRA", flag: "brasil.png" },
  "CRISTIAN": { code: "ARG", flag: "argentina.png" },
  "EMI":      { code: "FRA", flag: "francia.png" }
};

let partidosDataGlobal = [];

/* ================= ACCESO / LOGIN (REPARADO Y SIN CHOQUES) ================= */
function checkPassword() {
  const input = document.getElementById("password");
  if (!input) {
    alert("Error técnico: No se encontró el cuadro de texto 'password' en el HTML.");
    return;
  }

  if (input.value === PASSWORD) {
    // Ocultar pantalla de login y mostrar el juego
    document.getElementById("login").style.display = "none";
    document.getElementById("content").classList.remove("hidden");
    
    // Ejecutar las cargas de datos inmediatamente
    loadAllData();
    loadChampions();
  } else {
    alert("Contraseña incorrecta");
  }
}

/* ================= CARGA INTEGRADA DE DATOS ================= */
async function loadAllData() {
  const table = document.getElementById("table-body");
  const container = document.getElementById("lista-fechas");

  // 1. Cargar datos guardados en la memoria caché para velocidad instantánea
  const cachedTable = localStorage.getItem("liga_tabla_cache");
  const cachedMarcador = localStorage.getItem("liga_marcador_cache");

  if (cachedTable && table) {
    try { renderTableRows(JSON.parse(cachedTable)); } catch(e) { console.log(e); }
  }
  if (cachedMarcador && container) {
    try {
      partidosDataGlobal = JSON.parse(cachedMarcador);
      renderMarcadorLista(partidosDataGlobal);
    } catch(e) { console.log(e); }
  }

  // 2. Consultar los datos frescos a tu Google Sheets en segundo plano
  try {
    const res = await fetch(URL);
    const fullData = await res.json();
    
    // Procesar Pestaña de Posiciones (Tabla / Hoja 1)
    const tablaData = fullData.tabla || (Array.isArray(fullData) ? fullData : []); 
    if (tablaData.length > 0) {
      tablaData.sort((a, b) => (b.PTS || 0) - (a.PTS || 0));
      localStorage.setItem("liga_tabla_cache", JSON.stringify(tablaData));
      if (table) renderTableRows(tablaData);
    }
    
    // Procesar Pestaña de Calendario (Marcador / Hoja 2)
    const partidosData = fullData.partidos || fullData.marcador || fullData.hoja2 || fullData.Hoja2 || [];
    if (partidosData.length > 0) {
      partidosDataGlobal = partidosData;
      localStorage.setItem("liga_marcador_cache", JSON.stringify(partidosData));
      if (container) renderMarcadorLista(partidosData);
    }
  } catch (error) {
    console.log("Error sincronizando servidor:", error);
  }
}

function renderTableRows(data) {
  const table = document.getElementById("table-body");
  if (!table) return;
  table.innerHTML = "";

  data.forEach((team, i) => {
    if (!team.EQUIPO) return;
    const row = document.createElement("div");
    row.className = "row" + (i === 0 ? " leader" : "");

    row.innerHTML = `
      <span>${i + 1}</span>
      <div class="team">
        <img src="img/${team.ESCUDO || 'default.png'}" alt="Escudo">
        <span>${team.EQUIPO || ""}</span>
      </div>
      <span>${team.PJ || 0}</span>
      <span>${team.PG || 0}</span>
      <span>${team.PP || 0}</span>
      <span>${team.PA || 0}</span>
      <span>${team.PTS || 0}</span>
    `;
    table.appendChild(row);
  });
}

/* ================= DISEÑO DEL CALENDARIO (LISTA DE FECHAS) ================= */
function renderMarcadorLista(partidos) {
  const container = document.getElementById("lista-fechas");
  if (!container) return;
  container.innerHTML = "";

  // Agrupar filas de partidos por su número de Fecha
  const fechasAgrupadas = {};
  partidos.forEach(p => {
    if (p.Fecha === undefined || p.Fecha === "") return;
    if (!fechasAgrupadas[p.Fecha]) {
      fechasAgrupadas[p.Fecha] = [];
    }
    fechasAgrupadas[p.Fecha].push(p);
  });

  const todasLasFechas = Object.keys(fechasAgrupadas);
  if (todasLasFechas.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 25px; color: #ffd700;">Conectado a Google Sheets. Esperando actualización de datos...</div>`;
    return;
  }

  // Ordenar y dibujar las tarjetas de cada fecha
  todasLasFechas.sort((a, b) => Number(a) - Number(b)).forEach(numFecha => {
    const listaPartidos = fechasAgrupadas[numFecha];
    const card = document.createElement("div");
    card.className = "fecha-card";
    
    let partidosHTML = "";
    listaPartidos.forEach((partido) => {
      const eq1 = (partido.Equipo1 || "").toUpperCase().trim();
      const eq2 = (partido.Equipo2 || "").toUpperCase().trim();
      
      const img1 = TEAM_DATA[eq1]?.flag || "default.png";
      const img2 = TEAM_DATA[eq2]?.flag || "default.png";
      
      const g1 = (partido.Goles1 !== undefined && partido.Goles1 !== "") ? partido.Goles1 : null;
      const g2 = (partido.Goles2 !== undefined && partido.Goles2 !== "") ? partido.Goles2 : null;
      const centroText = (g1 === null && g2 === null) ? "VS" : `${g1} - ${g2}`;

      const indexGlobal = partidos.indexOf(partido);

      partidosHTML += `
        <div class="partido-fila-mini" onclick="ampliarMarcador(${indexGlobal})">
          <div class="equipo-mini">
            <img src="img/${img1}" alt="">
            <span>${eq1 || "---"}</span>
          </div>
          <span class="vs-mini">${centroText}</span>
          <div class="equipo-mini derecha">
            <span>${eq2 || "---"}</span>
            <img src="img/${img2}" alt="">
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="fecha-titulo">Fecha ${numFecha}</div>
      <div class="partidos-grupo">${partidosHTML}</div>
    `;
    container.appendChild(card);
  });
}


/* ================= VISTA MARCADOR AMPLIADO FIFA (CORREGIDO) ================= */
function ampliarMarcador(indexPartido) {
  const partido = partidosDataGlobal[indexPartido];
  if (!partido) return;

  const eq1 = (partido.Equipo1 || "").toUpperCase().trim();
  const eq2 = (partido.Equipo2 || "").toUpperCase().trim();

  document.getElementById("fifa-code-1").innerText = TEAM_DATA[eq1]?.code || "---";
  document.getElementById("fifa-code-2").innerText = TEAM_DATA[eq2]?.code || "---";
  document.getElementById("fifa-flag-1").src = `img/${TEAM_DATA[eq1]?.flag || 'default.png'}`;
  document.getElementById("fifa-flag-2").src = `img/${TEAM_DATA[eq2]?.flag || 'default.png'}`;

  const g1 = (partido.Goles1 !== undefined && partido.Goles1 !== "") ? partido.Goles1 : "0";
  const g2 = (partido.Goles2 !== undefined && partido.Goles2 !== "") ? partido.Goles2 : "0";

  document.getElementById("fifa-score-1").innerText = g1;
  document.getElementById("fifa-score-2").innerText = g2;

  // 1. OCULTAR por completo la lista de fechas para que no estorbe abajo
  const listaFechas = document.getElementById("lista-fechas");
  if (listaFechas) listaFechas.style.display = "none";

  // 2. MOSTRAR la pantalla del marcador FIFA
  const marcadorPantalla = document.getElementById("marcador-pantalla");
  if (marcadorPantalla) {
    marcadorPantalla.classList.remove("hidden");
    marcadorPantalla.style.display = "block";
  }

  // 3. SE ARREGLA EL FONDO: Forzar a la pantalla a subir al inicio del todo de forma inmediata
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function regresarALista() {
  // 1. Ocultar la pantalla del marcador extendido
  const marcadorPantalla = document.getElementById("marcador-pantalla");
  if (marcadorPantalla) {
    marcadorPantalla.classList.add("hidden");
    marcadorPantalla.style.display = "none";
  }

  // 2. Volver a hacer visible la lista con las 26 fechas
  const listaFechas = document.getElementById("lista-fechas");
  if (listaFechas) {
    listaFechas.classList.remove("hidden");
    listaFechas.style.display = "block";
  }
  
  // 3. Subir al inicio para comodidad del usuario al volver al fixture
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ================= SECCIÓN CAMPEONES (RASTREO AUTOMÁTICO) ================= */
async function loadChampions() {
  // Capturamos el contenedor sin importar si en el HTML se llama champions-body o campeones-body
  const container = document.getElementById("champions-body") || document.getElementById("campeones-body");
  if (!container) {
    console.log("Error: No se encontró el contenedor de campeones en el HTML.");
    return;
  }
  
  container.innerHTML = `<div style="text-align:center; padding: 25px; color: #ffd700; font-size:12px;">Cargando campeones...</div>`;

  try {
    const res = await fetch(URL);
    const fullData = await res.json();
    
    let rawRows = [];

    // RASTREADOR: Revisamos cada parte del archivo de Google Sheets que nos llega
    if (Array.isArray(fullData)) {
      rawRows = fullData;
    } else {
      // Si viene dividido por pestañas (Hoja 1, Hoja 3, etc.), buscamos cuál tiene los datos
      for (const key in fullData) {
        if (Array.isArray(fullData[key]) && fullData[key].length > 0) {
          const primeraFila = fullData[key][0];
          // Si la pestaña contiene la columna CAMPEON, ¡la encontramos!
          if (primeraFila.hasOwnProperty("CAMPEON") || primeraFila.hasOwnProperty("campeon")) {
            rawRows = fullData[key];
            break;
          }
        }
      }
    }

    // Si el rastreador no encontró nada, probamos un último intento con nombres comunes
    if (rawRows.length === 0) {
      rawRows = fullData["Hoja 3"] || fullData["Hoja3"] || fullData["hoja3"] || fullData["Hoja 1"] || [];
    }

    // Si definitivamente no hay datos
    if (rawRows.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 25px; color: #ffd700; font-size:12px;">No se encontraron las columnas en tu Google Sheets.</div>`;
      return;
    }

    const listaProcesada = [];

    // Procesamos y limpiamos las filas encontradas
    rawRows.forEach(item => {
      const nombre = item.CAMPEON || item.campeon;
      const fechas = item.FECHAS || item.fechas;

      if (nombre && String(nombre).trim() !== "" && String(nombre).toUpperCase().trim() !== "CAMPEON") {
        listaProcesada.push({
          CAMPEON: String(nombre).trim().toUpperCase(),
          FECHAS: fechas ? String(fechas).trim() : ""
        });
      }
    });

    if (listaProcesada.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 25px; color: #ffd700; font-size:12px;">Estructura vacía. Comprueba los datos en tu Sheets.</div>`;
      return;
    }

    // Ordenar de mayor a menor por cantidad de títulos
    listaProcesada.sort((a, b) => {
      const cantA = a.FECHAS ? a.FECHAS.split(",").length : 0;
      const cantB = b.FECHAS ? b.FECHAS.split(",").length : 0;
      return cantB - cantA;
    });

    // Guardar en la caché interna
    localStorage.setItem("liga_campeones_cache", JSON.stringify(listaProcesada));
    
    // Dibujar en pantalla
    renderChampionsRows(listaProcesada);

  } catch (error) {
    console.log("Error en la conexión de Campeones:", error);
    container.innerHTML = `<div style="text-align:center; padding: 25px; color: #ff4b4b; font-size:12px;">Error al conectar con Google Sheets.</div>`;
  }
}

function renderChampionsRows(campeones) {
  const container = document.getElementById("champions-body") || document.getElementById("campeones-body");
  if (!container) return;
  container.innerHTML = "";

  campeones.forEach(player => {
    const row = document.createElement("div");
    row.className = "champion-row";

    const fechasArray = player.FECHAS ? player.FECHAS.split(",") : [];
    const cantidad = player.FECHAS !== "" ? fechasArray.length : 0;

    // Generar las estrellas doradas según la cantidad de títulos
    let starsHTML = "";
    for (let i = 0; i < cantidad; i++) {
      starsHTML += `<img src="img/estrella.png" class="star" alt="★">`;
    }

    // Lista de copas desplegables
    const fechasHTML = cantidad > 0 
      ? fechasArray.map(f => `<p>🏆 ${f.trim()}</p>`).join("") 
      : "<p>Sin fechas registradas</p>";

    // HTML Limpio: Se eliminó por completo la línea de los títulos entre paréntesis
    row.innerHTML = `
      <div class="champion-main-info">
        <span class="champion-name">${player.CAMPEON}</span>
        <div class="champion-achievements">
          <div class="stars-container">${starsHTML}</div>
        </div>
      </div>
      <div class="titles-box">${fechasHTML}</div>
    `;

    row.addEventListener("click", () => {
      const box = row.querySelector(".titles-box");
      if (box) box.classList.toggle("active");
    });

    container.appendChild(row);
  });
}


/* ================= NAVEGACIÓN ENTRE PESTAÑAS ================= */
function showSection(event, id) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".menu-btn").forEach(button => {
    button.classList.remove("active");
  });
  
  const targetSec = document.getElementById(id);
  if (targetSec) targetSec.classList.add("active");
  if (event && event.target) event.target.classList.add("active");
}



/* ================= NAVEGACIÓN ENTRE PESTAÑAS ================= */
function showSection(event, id) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".menu-btn").forEach(button => {
    button.classList.remove("active");
  });
  
  const targetSec = document.getElementById(id);
  if (targetSec) targetSec.classList.add("active");
  if (event && event.target) event.target.classList.add("active");
}
