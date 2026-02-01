const URL = "https://script.google.com/macros/s/AKfycbxSwoqhpMIbJzsLG7cXKlj2YXGNXiIAeVYsDUQUdI1Umzl_N4jCnaqC2UicDDOdNOQYRw/exec";
const PASSWORD = "1234"; // cambiá esto

function checkPassword() {
  const input = document.getElementById("password").value;

  if (input === PASSWORD) {
    document.getElementById("login").style.display = "none";
    document.getElementById("content").classList.remove("hidden");
    loadTable();
  } else {
    alert("Contraseña incorrecta");
  }
}

async function loadTable() {
  const res = await fetch(URL);
  const data = await res.json();

  data.sort((a, b) => b.PTS - a.PTS);

  const table = document.getElementById("table-body");
  table.innerHTML = "";

  data.forEach((team, i) => {
    const row = document.createElement("div");
    row.className = "row" + (i === 0 ? " leader" : "");

    row.innerHTML = `
      <span>${i + 1}</span>
      <div class="team">
        <img src="img/${team.ESCUDO}">

        <span>${team.EQUIPO}</span>
      </div>
      <span>${team.PJ}</span>
      <span>${team.PG}</span>
      <span>${team.PP}</span>
      <span>${team.PA}</span>
      <span class="pts">${team.PTS}</span>
    `;

    table.appendChild(row);
  });
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");
}
