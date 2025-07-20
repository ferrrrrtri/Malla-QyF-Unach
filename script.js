
const estado = {};

const ramos = document.querySelectorAll('.ramo');

function actualizarDesbloqueos() {
  ramos.forEach(ramo => {
    const id = ramo.dataset.id;
    const requisitos = ramo.dataset.prer?.split(',') || [];

    if (!estado[id] && requisitos.length > 0) {
      const desbloqueado = requisitos.every(req => estado[req] === 'aprobado');
      if (desbloqueado) {
        ramo.classList.add('desbloqueado');
      }
    }
  });
}

function verificarSemestresCompletos() {
  const semestres = document.querySelectorAll('.semestre');
  semestres.forEach(sem => {
    const ramos = sem.querySelectorAll('.ramo');
    const todosAprobados = Array.from(ramos).every(r => r.classList.contains('aprobado'));

    if (todosAprobados && !sem.classList.contains('celebrado')) {
      sem.classList.add('celebrado');
      mostrarCelebracion(sem);
    }
  });
}

function mostrarCelebracion(semestreDiv) {
  const mensaje = document.createElement('div');
  mensaje.className = 'felicitacion';
  mensaje.innerHTML = '🎉 ¡Felicidades! Completaste este semestre 🎓';
  semestreDiv.appendChild(mensaje);
  setTimeout(() => mensaje.remove(), 4000);
}

ramos.forEach(ramo => {
  const id = ramo.dataset.id;
  const requisitos = ramo.dataset.prer?.split(',') || [];

  if (requisitos.length > 0) {
    const nombresRequisitos = requisitos.map(id => {
      const r = document.querySelector(`[data-id="${id}"]`);
      return r ? r.textContent : id;
    }).join(', ');
    ramo.setAttribute('title', `Aún no puedes cursar esta asignatura. Requiere aprobar: ${nombresRequisitos}`);
  }

  ramo.addEventListener('click', () => {
    const desbloqueado = requisitos.length === 0 || requisitos.every(req => estado[req] === 'aprobado');

    if (!desbloqueado) return;

    estado[id] = 'aprobado';
    ramo.classList.remove('desbloqueado');
    ramo.classList.add('aprobado');

    actualizarDesbloqueos();
    verificarSemestresCompletos();
  });
});

document.getElementById('reset').addEventListener('click', () => {
  Object.keys(estado).forEach(k => delete estado[k]);
  ramos.forEach(r => {
    r.classList.remove('aprobado', 'desbloqueado');
  });
  document.querySelectorAll('.felicitacion').forEach(el => el.remove());
  document.querySelectorAll('.semestre').forEach(el => el.classList.remove('celebrado'));
});
