
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
      } else {
        ramo.classList.remove('desbloqueado');
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
    } else if (!todosAprobados && sem.classList.contains('celebrado')) {
      sem.classList.remove('celebrado');
      sem.querySelectorAll('.felicitacion')?.forEach(f => f.remove());
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

function mostrarAdvertencia(ramo, requisitos) {
  ramo.classList.add('rechazado');
  const nombres = requisitos.map(id => {
    const r = document.querySelector(`[data-id="${id}"]`);
    return r ? r.textContent : id;
  }).join(', ');
  alert(`Lo siento, aún no has aprobado: ${nombres}`);
  setTimeout(() => ramo.classList.remove('rechazado'), 1000);
}

function desmarcarDependientes(idPadre) {
  ramos.forEach(ramo => {
    const id = ramo.dataset.id;
    const requisitos = ramo.dataset.prer?.split(',') || [];

    if (requisitos.includes(idPadre) && estado[id]) {
      delete estado[id];
      ramo.classList.remove('aprobado', 'desbloqueado');
      desmarcarDependientes(id);
    }
  });
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
    const esAprobado = ramo.classList.contains('aprobado');
    const desbloqueado = requisitos.length === 0 || requisitos.every(req => estado[req] === 'aprobado');

    if (esAprobado) {
      delete estado[id];
      ramo.classList.remove('aprobado');
      desmarcarDependientes(id);
      actualizarDesbloqueos();
      verificarSemestresCompletos();
      return;
    }

    if (!desbloqueado) {
      mostrarAdvertencia(ramo, requisitos.filter(req => !estado[req]));
      return;
    }

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
    r.classList.remove('aprobado', 'desbloqueado', 'rechazado');
  });
  document.querySelectorAll('.felicitacion').forEach(el => el.remove());
  document.querySelectorAll('.semestre').forEach(el => el.classList.remove('celebrado'));
});
