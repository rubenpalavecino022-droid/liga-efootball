const URL = "https://script.google.com/macros/s/AKfycbxFOyJr2GTJDBTHWIHmZQNM7eiRp0hrXMtizpsWWS6Ir9xZ7nPQfmacHWVPWrrpp8WUkQ/exec";
const PASSWORD = "1234";

let matches = [];
// Mapa dinámico: aprenderá automáticamente los equipos y sus escudos desde tu Sheet
let TEAMS_MAP = {};

/* LOGIN */
const loginScreen = document.getElementById("login-screen");
const app = document.getElementById("app");

function checkPassword(){
  const value = document.getElementById("password").value;
  if(value === PASSWORD){
    sessionStorage.setItem("liga_login", "true");
    openApp();
  } else {
    alert("Contraseña incorrecta");
  }
}

function openApp() {
  const body = document.body;
  const appContainer = document.getElementById("app");
  const loginScreen = document.getElementById("login-screen");

  appContainer.classList.remove("hidden");

  setTimeout(() => {
    body.classList.add("login-magic-exit");
    appContainer.classList.add("app-visible");
  }, 30);

  setTimeout(() => {
    loginScreen.style.display = "none";
    loadData();
  }, 750);
}

document.getElementById("login-btn").addEventListener("click", checkPassword);
document.getElementById("password").addEventListener("keypress", e => {
  if(e.key === "Enter") checkPassword();
});

if(sessionStorage.getItem("liga_login")){
  openApp();
}

/* NAVEGACIÓN DE PESTAÑAS (TABS) */
const tabs = document.querySelectorAll(".tab-btn");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));

    const targetSection = document.getElementById(btn.dataset.section);
    if (targetSection) {
      targetSection.classList.add("active");
    }
  });
});

/* CARGA DE DATOS DESDE GOOGLE SHEETS */
async function loadData(){
  try{
    const res = await fetch(URL);
    const data = await res.json();
    
    // 1. Procesa la tabla primero para registrar automáticamente los nombres y sus escudos
    if(data.tabla) { loadTable(data.tabla); }
    // 2. Muestra los partidos emparejando automáticamente las abreviaciones
    if(data.partidos) { loadMatches(data.partidos); }
    
    loadChampions(data);
    
  }catch(error){
    console.log("Error cargando la base de datos:", error);
  }
}

/* BUSCADOR AUTOMÁTICO DE ESCUDOS */
function findTeamInfo(rawName) {
  if (!rawName) return { code: "???", flag: "default.png" };
  const clean = String(rawName).trim().toUpperCase();

  // 1. Busca por coincidencia exacta (ej: "RUBEN" o "RU")
  if (TEAMS_MAP[clean]) {
    return TEAMS_MAP[clean];
  }

  // 2. Si no coincide exacto, busca si el texto del Sheet es el inicio de algún equipo registrado
  // Ejemplo: si en Fechas pusiste "RU", encuentra a "RUBEN" automáticamente.
  const matchedKey = Object.keys(TEAMS_MAP).find(key => key.startsWith(clean) || clean.startsWith(key));
  if (matchedKey) {
    return TEAMS_MAP[matchedKey];
  }

  // 3. Respaldo para equipos nuevos no registrados aún en la tabla
  return {
    code: clean.substring(0, 3),
    flag: clean.toLowerCase() + ".png"
  };
}

/* TABLA DE POSICIONES */
function loadTable(rows){
  const body = document.getElementById("table-body");
  if(!body) return;
  body.innerHTML = "";

  const sortedRows = [...rows].sort((a,b) => (b.PTS || 0) - (a.PTS || 0));

  sortedRows.forEach((team, index) => {
    const row = document.createElement("div");
    row.className = "table-row-fifa";

    const teamNameRaw = (team.EQUIPO || "").trim();
    const teamKey = teamNameRaw.toUpperCase();
    
    // Lee la imagen de la columna ESCUDO del Google Sheet
    const flagImage = team.ESCUDO || team.escudo || `${teamNameRaw.toLowerCase()}.png`;
    const displayCode = teamKey.substring(0, 3);

    // Guarda el equipo en la memoria automática del sistema
    const teamData = { code: displayCode, flag: flagImage };
    TEAMS_MAP[teamKey] = teamData;
    TEAMS_MAP[displayCode] = teamData; // Guarda también el código de 3 letras (ej: "RUB")
    TEAMS_MAP[teamKey.substring(0, 2)] = teamData; // Guarda también la abreviatura de 2 letras (ej: "RU")

    if(index === 0) {
      row.classList.add("leader-row");
    }

    row.innerHTML = `
      <div class="row-left-group">
        <span class="position-badge-fifa ${index === 0 ? 'is-leader' : ''}">${index + 1}</span>
        <img class="clean-crest" src="img/${flagImage}" onerror="this.src='img/default.png'">
        <span class="team-name-text-fifa">${displayCode}</span>
      </div>
      <div class="row-right-stats-fifa">
        <div class="stat-capsule"><span>${team.PJ || 0}</span></div>
        <div class="stat-capsule"><span>${team.PG || 0}</span></div>
        <div class="stat-capsule"><span>${team.PE || 0}</span></div>
        <div class="stat-capsule"><span>${team.PP || 0}</span></div>
        <div class="stat-capsule hide-on-small"><span>${team.GF || 0}</span></div>
        <div class="stat-capsule hide-on-small"><span>${team.GC || 0}</span></div>
        <div class="stat-capsule"><span>${team.DG || 0}</span></div>
        <div class="stat-capsule pts-capsule"><span>${team.PTS || 0}</span></div>
      </div>
    `;
    body.appendChild(row);
  });
}

/* CARGA DE FECHAS Y PARTIDOS */
function loadMatches(allMatches){
  matches = allMatches;
  const container = document.getElementById("fechas-container");
  if(!container) return;
  container.innerHTML = "";

  const grouped = {};
  matches.forEach(match => {
    const fecha = match.Fecha || match.FECHA;
    if(!fecha) return;
    if(!grouped[fecha]) { grouped[fecha] = []; }
    grouped[fecha].push(match);
  });

  Object.keys(grouped)
  .sort((a,b) => a - b)
  .forEach(fecha => {
    const card = document.createElement("div");
    card.className = "fecha-card";

    let matchesHTML = "";

    grouped[fecha].forEach(match => {
      const team1Raw = (match.Equipo1 || "").trim();
      const team2Raw = (match.Equipo2 || "").trim();

      // Utiliza la función inteligente para resolver el escudo de cada lado
      const team1Data = findTeamInfo(team1Raw);
      const team2Data = findTeamInfo(team2Raw);

      const g1 = match.Goles1;
      const g2 = match.Goles2;
      const scoreText = (g1 === "" || g1 === undefined || g1 === null) ? "VS" : `${g1} - ${g2}`;

      matchesHTML += `
        <div class="match-row">
          <div class="team-mini">
            <img class="clean-crest" src="img/${team1Data.flag}" onerror="this.src='img/default.png'">
            <span class="match-team-name-text">${team1Data.code}</span>
          </div>
          <div class="match-score">${scoreText}</div>
          <div class="team-mini right">
            <span class="match-team-name-text">${team2Data.code}</span>
            <img class="clean-crest" src="img/${team2Data.flag}" onerror="this.src='img/default.png'">
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="fecha-title">Fecha ${fecha}</div>
      ${matchesHTML}
    `;
    container.appendChild(card);
  });
}

/* SECCIÓN CAMPEONES */
function loadChampions(data){
  const container = document.getElementById("champions-body");
  if(!container) return;
  container.innerHTML = "";

  let champions = [];
  for(const key in data){
    if(Array.isArray(data[key])){
      const first = data[key][0];
      if(first?.CAMPEON || first?.EDICIONES){
        champions = data[key];
        break;
      }
    }
  }

  champions.forEach(player => {
    const name = player.CAMPEON || "-";
    const editions = player.EDICIONES || "";
    const list = editions.split(",");

    let stars = "";
    list.forEach(() => {
      stars += `<img src="img/estrella.png" class="star">`;
    });

    const card = document.createElement("div");
    card.className = "champion-card";
    card.innerHTML = `
      <div class="champion-top">
        <div class="champion-name">${name}</div>
        <div class="stars">${stars}</div>
      </div>
      <div class="titles">
        ${list.map(item => `<p>🏆 ${item.trim()}</p>`).join("")}
      </div>
    `;

    card.addEventListener("click", () => {
      card.querySelector(".titles").classList.toggle("active");
    });

    container.appendChild(card);
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(err => console.log(err));
  });
}
