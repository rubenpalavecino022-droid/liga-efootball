const URL = "https://script.google.com/macros/s/AKfycbxFOyJr2GTJDBTHWIHmZQNM7eiRp0hrXMtizpsWWS6Ir9xZ7nPQfmacHWVPWrrpp8WUkQ/exec";
const PASSWORD = "1234";

/* TEAMS CON COLORES DINÁMICOS */
const TEAMS = {
  RUBEN: { code: "ESP", flag: "españa.png" },
  GONZALO: { code: "BRA", flag: "brasil.png" },
  CRISTIAN: { code: "ARG", flag: "argentina.png" }
};

let matches = [];

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

    const fechasCont = document.getElementById("fechas-container");
    const matchScr = document.getElementById("match-screen");
    if (fechasCont && matchScr) {
      fechasCont.classList.remove("hidden");
      matchScr.classList.add("hidden");
    }
  });
});

/* CARGA DE DATOS SEGUIDA Y SEGURA */
async function loadData(){
  try{
    const res = await fetch(URL);
    const data = await res.json();
    
    if(data.tabla) { loadTable(data.tabla); }
    if(data.partidos) { loadMatches(data.partidos); }
    loadChampions(data);
    
  }catch(error){
    console.log("Error cargando la base de datos:", error);
  }
}

/* TABLA DE POSICIONES INTERFACES TOTALMENTE CALIBRADA */
function loadTable(rows){
  const body = document.getElementById("table-body");
  if(!body) return;
  body.innerHTML = "";

  const sortedRows = [...rows].sort((a,b) => (b.PTS || 0) - (a.PTS || 0));

  sortedRows.forEach((team, index) => {
    const row = document.createElement("div");
    row.className = "table-row-fifa";

    const teamNameRaw = (team.EQUIPO || "").trim().toUpperCase();
    const teamData = TEAMS[teamNameRaw] || { flag: "default.png" };
    
    const shortName = teamNameRaw.substring(0, 3);
    
    if(index === 0) {
      row.classList.add("leader-row");
    }

    row.innerHTML = `
      <div class="row-left-group">
        <span class="position-badge-fifa ${index === 0 ? 'is-leader' : ''}">${index + 1}</span>
        <img class="flag-asymmetric" src="img/${teamData.flag}" onerror="this.src='img/default.png'">
        <span class="team-name-text-fifa">${shortName}</span>
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

/* CARGA DE FECHAS Y PARTIDOS (UNIFICADO CON BANDERA ASIMÉTRICA Y NOMBRE CORTO) */
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
      const team1Raw = (match.Equipo1 || "").trim().toUpperCase();
      const team2Raw = (match.Equipo2 || "").trim().toUpperCase();
      const team1Data = TEAMS[team1Raw] || { flag: "default.png" };
      const team2Data = TEAMS[team2Raw] || { flag: "default.png" };

      // Abreviación simétrica automática en fechas también
      const short1 = team1Raw.substring(0, 3);
      const short2 = team2Raw.substring(0, 3);

      const g1 = match.Goles1;
      const g2 = match.Goles2;
      const scoreText = (g1 === "" || g1 === undefined || g1 === null) ? "VS" : `${g1} - ${g2}`;

      matchesHTML += `
        <div class="match-row" onclick="openMatch(${matches.indexOf(match)})">
          <div class="team-mini">
            <img class="flag-asymmetric-mini" src="img/${team1Data.flag}" onerror="this.src='img/default.png'">
            <span class="match-team-name-text">${short1}</span>
          </div>
          <div class="match-score">${scoreText}</div>
          <div class="team-mini right">
            <span class="match-team-name-text">${short2}</span>
            <img class="flag-asymmetric-mini" src="img/${team2Data.flag}" onerror="this.src='img/default.png'">
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

/* FUNCIÓN PARA ABRIR MARCADORES REALES */
function openMatch(index) {
  const match = matches[index];
  if (!match) return;

  const team1 = (match.Equipo1 || "").trim().toUpperCase();
  const team2 = (match.Equipo2 || "").trim().toUpperCase();
  const team1Data = TEAMS[team1] || { code: team1.substring(0,3), flag: "default.png" };
  const team2Data = TEAMS[team2] || { code: team2.substring(0,3), flag: "default.png" };

  document.getElementById("flag-1").src = `img/${team1Data.flag}`;
  document.getElementById("flag-2").src = `img/${team2Data.flag}`;

  document.getElementById("code-1").innerText = team1Data.code;
  document.getElementById("code-2").innerText = team2Data.code;

  document.getElementById("score-1").innerText = (match.Goles1 !== "" && match.Goles1 !== undefined) ? match.Goles1 : "0";
  document.getElementById("score-2").innerText = (match.Goles2 !== "" && match.Goles2 !== undefined) ? match.Goles2 : "0";

  document.getElementById("fechas-container").classList.add("hidden");
  document.getElementById("match-screen").classList.remove("hidden");
}

document.getElementById("volver-btn").addEventListener("click", () => {
  document.getElementById("fechas-container").classList.remove("hidden");
  document.getElementById("match-screen").classList.add("hidden");
});

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
