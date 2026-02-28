/* ================= CONFIG ================= */

const URL = "https://script.google.com/macros/s/AKfycbxSwoqhpMIbJzsLG7cXKlj2YXGNXiIAeVYsDUQUdI1Umzl_N4jCnaqC2UicDDOdNOQYRw/exec";
const PASSWORD = "1234";


/* ================= TABLA ================= */

async function loadTable() {
  try {

    const res = await fetch(URL);
    const data = await res.json();

    data.sort((a, b) => (b.PTS || 0) - (a.PTS || 0));

    const table = document.getElementById("table-body");
    table.innerHTML = "";

    data.forEach((team, i) => {

      const row = document.createElement("div");
      row.className = "row" + (i === 0 ? " leader" : "");

      row.innerHTML = `
        <span>${i + 1}</span>
        <div class="team">
          <img src="img/${team.ESCUDO || 'default.png'}" width="35">
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

  } catch (error) {
    console.log("Error cargando tabla:", error);
  }
}


/* ================= CAMPEONES ================= */

async function loadChampions() {

  try {

    const res = await fetch(URL);
    const data = await res.json();

    const container = document.getElementById("champions-body");
    container.innerHTML = "";

    const campeones = data.filter(item =>
      item.CAMPEON &&
      item.CAMPEON.trim() !== "" &&
      item.FECHAS &&
      item.FECHAS.trim() !== ""
    );

    // Ordenar por cantidad de fechas (más títulos primero)
    campeones.sort((a, b) => {
      const countA = a.FECHAS.split(",").length;
      const countB = b.FECHAS.split(",").length;
      return countB - countA;
    });

    campeones.forEach(player => {

      const row = document.createElement("div");
      row.className = "champion-row";

      const fechas = player.FECHAS.split(",");
      const cantidad = fechas.length;

      // Crear estrellas automáticamente
      let starsHTML = "";
      for (let i = 0; i < cantidad; i++) {
        starsHTML += `
  <img src="img/estrella.png" class="star">
`;
      }

      const fechasHTML = fechas.map(f => 
        `<p>🏆 ${f.trim()}</p>`
      ).join("");

      row.innerHTML = `
        <span>${player.CAMPEON}</span>
        <div>${starsHTML}</div>
        <div class="titles-box">${fechasHTML}</div>
      `;

      // Click en estrellas
      row.querySelectorAll(".star").forEach(star => {
        star.addEventListener("click", () => {
          row.querySelector(".titles-box").classList.toggle("active");
        });
      });

      container.appendChild(row);
    });

  } catch (error) {
    console.log("Error cargando campeones:", error);
  }
}



/* ================= LOGIN ================= */

function checkPassword() {

  const input = document.getElementById("password").value;

  if (input === PASSWORD) {

    document.getElementById("login").style.display = "none";
    document.getElementById("content").classList.remove("hidden");

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

