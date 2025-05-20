'use strict';



/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}



/**
 * navbar toggle
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const navLinks = document.querySelectorAll("[data-nav-link]");

const toggleNavbar = function () { navbar.classList.toggle("active"); }

addEventOnElem(navTogglers, "click", toggleNavbar);

const closeNavbar = function () { navbar.classList.remove("active"); }

addEventOnElem(navLinks, "click", closeNavbar);



/**
 * header & back top btn active
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

window.addEventListener("scroll", function () {
  if (window.scrollY >= 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha");
  const horaInput = document.getElementById("hora");
  const horariosBtns = document.querySelectorAll(".btn-horario");
  const bicicletasContainer = document.getElementById("bicicletas");
  const formulario = document.getElementById("reservaForm");
  const mensaje = document.getElementById("mensaje");

  let selectedBicicleta = null;

  // Selección visual del horario
  horariosBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      horariosBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      horaInput.value = btn.dataset.hora;
      actualizarBicicletas();
    });
  });

  // Validar que no sea domingo
  fechaInput.addEventListener("change", () => {
    if (!fechaInput.value) return;

    const [year, month, day] = fechaInput.value.split("-");
    const fecha = new Date(year, month - 1, day);

    if (fecha.getDay() === 0) {
      alert("🚫 Los domingos no se puede apartar.");
      fechaInput.value = "";
      bicicletasContainer.innerHTML = "";
      return;
    }

    actualizarBicicletas();
  });

  // Función principal para mostrar bicis
  async function actualizarBicicletas() {
    const fecha = fechaInput.value;
    const hora = horaInput.value;

    console.log("🕓 Actualizando bicicletas para:", fecha, hora);

    if (!fecha || !hora) {
      bicicletasContainer.innerHTML = "<p style='color:white;text-align:center;'>Selecciona una fecha y horario válidos.</p>";
      return;
    }

    bicicletasContainer.innerHTML = "";
    selectedBicicleta = null;

    let ocupadas = [];

    try {
      const snapshot = await db.collection("reservas")
        .where("fecha", "==", fecha)
        .where("hora", "==", hora)
        .get();

      ocupadas = snapshot.empty ? [] : snapshot.docs.map(doc => doc.data().bicicleta);
    } catch (error) {
      console.error("Firebase error:", error);
      mensaje.innerHTML = "❌ Error al cargar bicicletas.<br><small>" + error.message + "</small>";
      ocupadas = []; // continuar para pruebas aunque falle
    }

    for (let i = 1; i <= 25; i++) {
      const div = document.createElement("div");
      div.classList.add("bicicleta");
      div.textContent = i;

      if (ocupadas.includes(i)) {
        div.classList.add("ocupada");
        div.innerHTML = "🚫<br>" + i;
      } else {
        div.classList.add("disponible");
        div.addEventListener("click", () => {
          document.querySelectorAll(".bicicleta.selected").forEach(el => el.classList.remove("selected"));
          div.classList.add("selected");
          selectedBicicleta = i;
        });
      }

      bicicletasContainer.appendChild(div);
      console.log("🚴 Bicicleta", i, ocupadas.includes(i) ? "Ocupada" : "Disponible");
    }
  }

  // Guardar reserva y generar boleto
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const fecha = fechaInput.value;
    const hora = horaInput.value;

    if (!fecha || !hora || !selectedBicicleta || !nombre) {
      alert("⚠️ Por favor completa todos los campos y selecciona una bicicleta.");
      return;
    }

    try {
      await db.collection("reservas").add({
        nombre,
        fecha,
        hora,
        bicicleta: selectedBicicleta
      });

      mensaje.innerHTML = `✅ ¡Reserva exitosa!<br>Bicicleta #${selectedBicicleta}<br>${fecha} - ${hora}`;
      mensaje.scrollIntoView({ behavior: "smooth" });

      // Generar boleto
      document.getElementById("c-nombre").textContent = "Nombre: " + nombre;
      document.getElementById("c-bicicleta").textContent = "Bicicleta: #" + selectedBicicleta;
      document.getElementById("c-fecha").textContent = "Fecha: " + fecha;
      document.getElementById("c-hora").textContent = "Hora: " + hora;

      const comprobante = document.getElementById("comprobante");
      comprobante.style.display = "block";

      setTimeout(() => {
        html2canvas(comprobante).then(canvas => {
          const link = document.createElement("a");
          link.download = `boleto-spinergy-${fecha}-${hora}.png`;
          link.href = canvas.toDataURL();
          link.click();
          comprobante.style.display = "none";
        });
      }, 500);

      // Reset
      formulario.reset();
      horaInput.value = "";
      horariosBtns.forEach(b => b.classList.remove("active"));
      bicicletasContainer.innerHTML = "";
      selectedBicicleta = null;

    } catch (err) {
      console.error("🔥 ERROR al guardar:", err);
      mensaje.innerHTML = "❌ Error al guardar la reserva.<br><small>" + err.message + "</small>";
    }
  });
});

