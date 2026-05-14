/* ================= CONFIG ================= */
const URL = "https://script.google.com/macros/s/AKfycbxSwoqhpMIbJzsLG7cXKlj2YXGNXiIAeVYsDUQUdI1Umzl_N4jCnaqC2UicDDOdNOQYRw/exec";
const PASSWORD = "1234";

/* ================= TABLA OPTIMIZADA CON CACHÉ ================= */
async function loadTable() {
  const table = document.getElementById("table-body");

  // 1. Cargar instantáneamente lo que esté guardado en el celular (0 demoras)
  const cachedTable = localStorage.getItem("liga_tabla_cache");
  if (cachedTable) {
    renderTableRows(JSON.parse(cachedTable));
  } else {
    // Si es la primera vez que entran y no hay caché, muestra un aviso elegante
    table.innerHTML = `<div style="text-align:center; padding: 25px; color: #ffd700; font-weight:700; font-size:13px; animation: pulse 1.5s infinite;">Cargando datos oficiales...</div>`;
  }

  // 2. Ir a buscar los datos frescos a Google Sheets en segundo plano
  try {
    const res = await fetch(URL);
    const data = await res.json();

    // Ordenamos por puntos (PTS) de mayor a menor
    data.sort((a, b) => (b.PTS || 0) - (a.PTS || 0));

    // Guardamos en el celular para la próxima apertura de la app
    localStorage.setItem("liga_tabla_cache", JSON.stringify(data));
    
    // Actualizamos la interfaz con los datos reales y nuevos
    renderTableRows(data);
  } catch (error) {
    console.log("Error cargando tabla en segundo plano:", error);
  }
}

// Función auxiliar encargada de pintar el diseño exacto de las filas
function renderTableRows(data) {
  const table = document.getElementById("table-body");
  table.innerHTML = "";

  data.forEach((team, i) => {
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

/* ================= CAMPEONES OPTIMIZADO CON CACHÉ ================= */
async function loadChampions() {
  const container = document.getElementById("champions-body");

  // 1. Intentar renderizar campeones desde la caché local primero
  const cachedChampions = localStorage.getItem("liga_campeones_cache");
  if (cachedChampions) {
    renderChampionsRows(JSON.parse(cachedChampions));
  }

  // 2. Traer los datos limpios desde Google en segundo plano
  try {
    const res = await fetch(URL);
    const data = await res.json();

    const campeones = data.filter(item =>
      item.CAMPEON &&
      item.CAMPEON.trim() !== "" &&
      item.FECHAS &&
      item.FECHAS.trim() !== ""
    );

    // Ordenamos por cantidad de títulos (estrellas)
    campeones.sort((a, b) => {
      const countA = a.FECHAS.split(",").length;
      const countB = b.FECHAS.split(",").length;
      return countB - countA;
    });

    // Guardamos en la memoria del móvil
    localStorage.setItem("liga_campeones_cache", JSON.stringify(campeones));
    
    // Renderizamos los datos actualizados
    renderChampionsRows(campeones);
  } catch (error) {
    console.log("Error cargando campeones en segundo plano:", error);
  }
}

// Función auxiliar para pintar las tarjetas de campeones y sus estrellas perfectas
function renderChampionsRows(campeones) {
  const container = document.getElementById("champions-body");
  container.innerHTML = "";

  campeones.forEach(player => {
    const row = document.createElement("div");
    row.className = "champion-row";

    const fechas = player.FECHAS.split(",");
    const cantidad = fechas.length;

    let starsHTML = "";
    for (let i = 0; i < cantidad; i++) {
      starsHTML += `<img src="img/estrella.png" class="star" alt="estrella">`;
    }

    const fechasHTML = fechas.map(f => 
      `<p>🏆 ${f.trim()}</p>`
    ).join("");

    row.innerHTML = `
      <span>${player.CAMPEON}</span>
      <div class="stars-container">${starsHTML}</div>
      <div class="titles-box">${fechasHTML}</div>
    `;

    // Evento interactivo para desplegar las copas al tocar las estrellas
    row.querySelectorAll(".star").forEach(star => {
      star.addEventListener("click", () => {
        row.querySelector(".titles-box").classList.toggle("active");
      });
    });

    container.appendChild(row);
  });
}

/* ================= LOGIN ================= */
function checkPassword() {
  const input = document.getElementById("password").value;
  if (input === PASSWORD) {
    document.getElementById("login").style.display = "none";
    document.getElementById("content").classList.remove("hidden");
    
    // Dispara las funciones optimizadas
    loadTable();
    loadChampions();
  } else {
    alert("Contraseña incorrecta");
  }
}

window.onload = function() {
  document.getElementById("password").focus();
  document.getElementById("password").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      checkPassword();
    }
  });
};

/* ================= NAVEGACIÓN ================= */
function showSection(event, id) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".menu-btn").forEach(button => {
    button.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");
}
