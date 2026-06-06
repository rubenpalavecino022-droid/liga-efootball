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

function openApp(){
  loginScreen.style.display = "none";
  app.classList.remove("hidden");
  loadData();
}

function checkPassword(){
  const value = document.getElementById("password").value;
  if(value === PASSWORD){
    sessionStorage.setItem("liga_login", "true");
    openApp();
  } else {
    alert("Contraseña incorrecta");
  }
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

/* TABLA DE POSICIONES */
function loadTable(rows){
  const body = document.getElementById("table-body");
  if(!body) return;
  body.innerHTML = "";

  const sortedRows = [...rows].sort((a,b) => (b.PTS || 0) - (a.PTS || 0));

  sortedRows.forEach((team, index) => {
    const row = document.createElement("div");
    row.className = "table-row";
    if(index === 0) { row.classList.add("leader"); }

    const teamName = (team.EQUIPO || "").trim().toUpperCase();
    const teamData = TEAMS[teamName] || { flag: "default.png" };

    row.innerHTML = `
      <span>${index + 1}</span>
      <div class="team-info">
        <img src="img/${teamData.flag}">
        <span>${team.EQUIPO || '-'}</span>
      </div>
      <span>${team.PJ || 0}</span>
      <span>${team.PG || 0}</span>
      <span>${team.PE || 0}</span>
      <span>${team.PP || 0}</span>
      <span>${team.GF || 0}</span>
      <span>${team.GC || 0}</span>
      <span>${team.DG || 0}</span>
      <span class="pts-style">${team.PTS || 0}</span>
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
    if(!grouped[fecha]) { grouped[grouped[fecha] = []] = []; grouped[fecha] = []; }
    grouped[fecha].push(match);
  });

  Object.keys(grouped)
  .sort((a,b) => a - b)
  .forEach(fecha => {
    const card = document.createElement("div");
    card.className = "fecha-card";

    let matchesHTML = "";

    grouped[fecha].forEach(match => {
      const team1 = (match.Equipo1 || "").trim().toUpperCase();
      const team2 = (match.Equipo2 || "").trim().toUpperCase();
      const team1Data = TEAMS[team1];
      const team2Data = TEAMS[team2];

      const g1 = match.Goles1;
      const g2 = match.Goles2;
      const scoreText = (g1 === "" || g1 === undefined || g1 === null) ? "VS" : `${g1} - ${g2}`;

      matchesHTML += `
        <div class="match-row" onclick="openMatch(${matches.indexOf(match)})">
          <div class="team-mini">
            <img src="img/${team1Data?.flag || 'default.png'}">
            <span>${match.Equipo1 || ''}</span>
          </div>
          <div class="match-score">${scoreText}</div>
          <div class="team-mini right">
            <span>${match.Equipo2 || ''}</span>
            <img src="img/${team2Data?.flag || 'default.png'}">
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

/* PANTALLA DETALLE DEL PARTIDO */
function openMatch(index){
  const match = matches[index];
  if(!match) return;

  const team1 = match.Equipo1.trim().toUpperCase();
  const team2 = match.Equipo2.trim().toUpperCase();

  const t1 = TEAMS[team1];
  const t2 = TEAMS[team2];

  document.getElementById("flag-1").src = `img/${t1?.flag || 'default.png'}`;
  document.getElementById("flag-2").src = `img/${t2?.flag || 'default.png'}`;

  document.getElementById("code-1").innerText = t1?.code || "---";
  document.getElementById("code-2").innerText = t2?.code || "---";

  document.getElementById("score-1").innerText = (match.Goles1 === "" || match.Goles1 === undefined) ? 0 : match.Goles1;
  document.getElementById("score-2").innerText = (match.Goles2 === "" || match.Goles2 === undefined) ? 0 : match.Goles2;

  document.getElementById("fechas-container").classList.add("hidden");
  document.getElementById("match-screen").classList.remove("hidden");
}

/* BOTÓN VOLVER */
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
