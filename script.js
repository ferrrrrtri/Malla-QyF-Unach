// Referencias a los elementos del DOM
const ramos = document.querySelectorAll('.ramo'),
      get   = k=>JSON.parse(localStorage.getItem(k))||[], // Obtiene datos del localStorage
      set   = (k,v)=>localStorage.setItem(k,JSON.stringify(v)), // Guarda datos en el localStorage
      busc  = document.getElementById('buscador'),
      areaF = document.getElementById('area-filter'),
      zoomR = document.getElementById('zoom'),
      clk   = document.getElementById('clock'),
      themeSwitch = document.getElementById('theme-switch'),
      container = document.getElementById('malla-container');

// Referencias a elementos del modal de información de ramo
const ramoInfoModal = document.getElementById('ramo-info-modal');
const modalRamoNombre = document.getElementById('modal-ramo-nombre');
const modalRamoCode = document.getElementById('modal-ramo-code');
const modalRamoArea = document.getElementById('modal-ramo-area');
const modalRamoCreditos = document.getElementById('modal-ramo-creditos');
const modalRamoReq = document.getElementById('modal-ramo-req');
const modalRamoDesc = document.getElementById('modal-ramo-desc');
const modalBtnAprobado = document.getElementById('modal-btn-aprobado');
const modalBtnDesmarcar = document.getElementById('modal-btn-desmarcar');
const modalCloseButton = ramoInfoModal.querySelector('.modal-close-button');
const modalBtnClose = document.getElementById('modal-btn-close');

// Referencias a elementos del modal de confirmación personalizado
const customConfirmModal = document.getElementById('custom-confirm-modal');
const confirmResetYes = document.getElementById('confirm-reset-yes');
const confirmResetNo = document.getElementById('confirm-reset-no');

// Referencias a elementos de créditos
const creditosTotalSpan = document.getElementById('creditos-total');
const creditosEspiritualSpan = document.getElementById('creditos-espiritual');
const creditosGeneralSpan = document.getElementById('creditos-general');
const creditosProfesionalSpan = document.getElementById('creditos-profesional');
const creditosEspecialidadSpan = document.getElementById('creditos-especialidad');
const creditosPracticaSpan = document.getElementById('creditos-practica');

// Nuevas referencias para el botón y modal del mensaje del tr._nico
const trNicoInfoBtn = document.getElementById('tr-nico-info-btn');
const trNicoMessageModal = document.getElementById('tr-nico-message-modal');
const trNicoModalCloseBtn = document.getElementById('tr-nico-modal-close-btn');
const trNicoMessageModalCloseButton = trNicoMessageModal.querySelector('.modal-close-button');

// Nuevas referencias para los botones de Exportar/Importar
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');


// Variables de estado
let aprobados = new Set(get('aprobados')), // Conjunto de ramos aprobados
    totalRamos = ramos.length, // Total de ramos en la malla
    completedSem = new Set(), // Semestres completados (para alertas)
    completedYear = new Set(); // Años completados (para alertas)

// Función para actualizar el reloj en el encabezado
function updateClock(){
  const now = new Date(),
        h = String(now.getHours()).padStart(2,'0'),
        m = String(now.getMinutes()).padStart(2,'0'),
        s = String(now.getSeconds()).padStart(2,'0');
  clk.textContent = `${h}:${m}:${s}`;
}
// Actualiza el reloj cada segundo
setInterval(updateClock,1000);
updateClock(); // Llama una vez al inicio para mostrar la hora inmediatamente

// Lógica para el cambio de tema (claro/oscuro)
// Carga el estado del tema al iniciar la página desde localStorage
if (localStorage.getItem('dark') === 'true') {
    document.body.classList.add('dark');
    themeSwitch.checked = true;
} else {
    themeSwitch.checked = false;
}

// Escucha el evento de cambio del switch para alternar el tema
themeSwitch.addEventListener('change', ()=>{
  document.body.classList.toggle('dark', themeSwitch.checked);
  localStorage.setItem('dark', document.body.classList.contains('dark'));
});

// Lógica para el zoom de la malla
zoomR.addEventListener('input', e=>{
  container.style.transform = `scale(${e.target.value/100})`;
});
// Aplica el zoom inicial al cargar la página
container.style.transform = `scale(${zoomR.value/100})`;

// Función para desmarcar ramos en cascada (si un prerequisito es desmarcado)
function cascadeRemove(code){
  aprobados.delete(code); // Elimina el ramo actual del conjunto de aprobados
  ramos.forEach(r=>{
    const deps = r.dataset.req ? r.dataset.req.split(',') : [];
    // Si este ramo depende del ramo desmarcado y también está aprobado, desmárcalo en cascada
    if(deps.includes(code) && aprobados.has(r.dataset.code))
      cascadeRemove(r.dataset.code);
  });
}

// Función principal para actualizar la interfaz de usuario
function updateUI(){
  let approvedCount = 0; // Contador de ramos aprobados globalmente
  let totalCreditosAprobados = 0;
  let creditosPorArea = {
      espiritual: 0,
      general: 0,
      profesional: 0,
      especialidad: 0,
      practica: 0
  };

  // Itera sobre cada semestre para actualizar su progreso y estado de los ramos
  document.querySelectorAll('.semestre').forEach(s=>{
    const hijos = s.querySelectorAll('.ramo'); // Todos los ramos en el semestre
    const prog  = s.querySelector('.progress-fill'); // La barra de progreso del semestre

    // Verifica si la barra de progreso existe antes de intentar acceder a su estilo
    if (!prog) {
        return; // Salta este semestre si no tiene una barra de progreso (ej. semestres vacíos)
    }

    let aproS = 0; // Contador de ramos aprobados en el semestre actual

    hijos.forEach(r=>{
      const code = r.dataset.code, // Código del ramo
            deps = r.dataset.req ? r.dataset.req.split(',') : []; // Prerequisitos del ramo
      r.classList.remove('aprobado','desbloqueado','highlight'); // Limpia clases anteriores

      if(aprobados.has(code)){
        r.classList.add('aprobado'); // Marca como aprobado
        aproS++; // Incrementa el contador de aprobados del semestre

        // Sumar créditos para el total y por área
        const creditos = parseInt(r.dataset.creditos);
        const area = r.dataset.area;
        if (!isNaN(creditos)) {
            totalCreditosAprobados += creditos;
            if (creditosPorArea[area] !== undefined) {
                creditosPorArea[area] += creditos;
            }
        }
      } else if(deps.length > 0 && deps.every(q => aprobados.has(q))){
        r.classList.add('desbloqueado'); // Marca como desbloqueado si los prerequisitos están aprobados
      }
    });

    // Actualiza la barra de progreso del semestre
    if (hijos.length > 0) {
        prog.style.width = (aproS / hijos.length * 100) + '%';
    } else {
        prog.style.width = '0%'; // Si no hay ramos, el progreso es 0
    }

    const sem = s.dataset.sem;
    // Muestra una alerta si el semestre está completo y no se ha alertado antes
    if(aproS === hijos.length && hijos.length > 0 && !completedSem.has(sem)){
      showCustomAlert(`¡Felicidades, sobreviviste al ${sem}° semestre!`);
      completedSem.add(sem);
    }
  });

  // Recalcula el contador global de progreso de la malla
  approvedCount = aprobados.size;
  document.getElementById('contador').textContent = Math.round(approvedCount / totalRamos * 100) + '%';

  // Actualizar los créditos en la UI
  creditosTotalSpan.textContent = totalCreditosAprobados;
  creditosEspiritualSpan.textContent = creditosPorArea.espiritual;
  creditosGeneralSpan.textContent = creditosPorArea.general;
  creditosProfesionalSpan.textContent = creditosPorArea.profesional;
  creditosEspecialidadSpan.textContent = creditosPorArea.especialidad;
  creditosPracticaSpan.textContent = creditosPorArea.practica;


  // Itera sobre cada año para verificar si está completo
  document.querySelectorAll('.year').forEach(y=>{
    const year = y.dataset.year;
    if(year){
      const sems = y.querySelectorAll('.semestre:not(.empty)'), // Semestres del año (excluyendo los vacíos)
            // Verifica si todos los semestres del año tienen el 100% de progreso
            allSemestersComplete  = [...sems].every(s=>
              parseFloat(s.querySelector('.progress-fill').style.width) === 100);
      // Si el año está completo y no se ha alertado antes
      if(allSemestersComplete && !completedYear.has(year)){
        y.setAttribute('data-year-complete',''); // Añade un atributo para el estilo visual
        showCustomAlert(`¡Felicidades, completaste el ${year}° año!`);
        completedYear.add(year);
      }
    }
  });
}

// Función para mostrar un modal de alerta personalizado (se mantiene el alert() por ahora)
function showCustomAlert(message) {
    alert(message);
}

// Función para mostrar el modal de información del ramo
let currentRamoElement = null; // Para almacenar el elemento del ramo que abrió el modal

function showRamoInfoModal(ramoElement) {
    currentRamoElement = ramoElement; // Guarda el elemento del ramo actual

    const code = ramoElement.dataset.code;
    const nombre = ramoElement.textContent.trim();
    const area = ramoElement.dataset.area;
    const creditos = ramoElement.dataset.creditos || 'N/A';
    const prerequisitos = ramoElement.dataset.req ? ramoElement.dataset.req.split(',').map(reqCode => {
        const reqRamo = document.querySelector(`.ramo[data-code="${reqCode}"]`);
        return reqRamo ? reqRamo.textContent.trim() : reqCode;
    }).join(', ') : 'Ninguno';
    const descripcion = ramoElement.dataset.desc || 'No hay descripción disponible.';

    modalRamoNombre.textContent = nombre;
    modalRamoCode.textContent = code;
    modalRamoArea.textContent = area.charAt(0).toUpperCase() + area.slice(1); // Capitalizar la primera letra
    modalRamoCreditos.textContent = creditos;
    modalRamoReq.textContent = prerequisitos;
    modalRamoDesc.textContent = descripcion;

    // Actualizar el estado de los botones de aprobar/desmarcar
    if (aprobados.has(code)) {
        modalBtnAprobado.style.display = 'none';
        modalBtnDesmarcar.style.display = 'inline-block';
    } else {
        modalBtnAprobado.style.display = 'inline-block';
        modalBtnDesmarcar.style.display = 'none';
    }

    ramoInfoModal.classList.add('show');
}

// Función para ocultar el modal de información del ramo
function hideRamoInfoModal() {
    ramoInfoModal.classList.remove('show');
    currentRamoElement = null; // Limpia la referencia al ramo
}

// Manejador de clic en un ramo
ramos.forEach(r=> r.onclick=()=>{
  showRamoInfoModal(r); // Abre el modal de información del ramo
});

// Event listeners para los botones del modal de información del ramo
modalCloseButton.addEventListener('click', hideRamoInfoModal);
modalBtnClose.addEventListener('click', hideRamoInfoModal);
ramoInfoModal.addEventListener('click', (e) => {
    if (e.target === ramoInfoModal) { // Solo cierra si se hace clic en el fondo
        hideRamoInfoModal();
    }
});

modalBtnAprobado.addEventListener('click', () => {
    if (currentRamoElement) {
        const code = currentRamoElement.dataset.code;
        const deps = currentRamoElement.dataset.req ? currentRamoElement.dataset.req.split(',') : [];

        if (deps.length > 0 && !deps.every(q => aprobados.has(q))) {
            const falt = deps.find(q => !aprobados.has(q));
            const nom = document.querySelector(`.ramo[data-code="${falt}"]`).textContent;
            currentRamoElement.classList.add('error');
            showCustomAlert(`Lo siento, aún no has aprobado "${nom.trim()}" para aprobar este ramo.`);
            currentRamoElement.addEventListener('animationend', () => currentRamoElement.classList.remove('error'), { once: true });
        } else {
            aprobados.add(code);
            set('aprobados', [...aprobados]);
            updateUI();
            hideRamoInfoModal();
        }
    }
});

modalBtnDesmarcar.addEventListener('click', () => {
    if (currentRamoElement) {
        const code = currentRamoElement.dataset.code;
        cascadeRemove(code);
        set('aprobados', [...aprobados]);
        updateUI();
        hideRamoInfoModal();
    }
});


// Funciones para el buscador y filtro por área
const normalize = s=> s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); // Normaliza texto
function filterRamos(){
  const q    = normalize(busc.value), // Valor del buscador normalizado
        area = areaF.value; // Valor del filtro de área
  ramos.forEach(r=>{
    const txt = normalize(r.textContent), // Texto del ramo normalizado
          a   = r.dataset.area; // Área del ramo
    // Muestra u oculta el ramo según el filtro y el buscador
    if((!q||txt.includes(q)) && (!area||a===area)){
      r.style.display='';
      // Añade o quita la clase 'highlight' si hay un filtro aplicado
      if(q !== '' || area !== '') {
          r.classList.add('highlight');
      } else {
          r.classList.remove('highlight');
      }
    } else {
      r.style.display='none';
      r.classList.remove('highlight');
    }
  });
}
// Escucha eventos de input y cambio para aplicar los filtros
busc.addEventListener('input',filterRamos);
areaF.addEventListener('change',filterRamos);

// Función para mostrar el modal de confirmación personalizado
let confirmCallback = null; // Para almacenar la función a ejecutar si se confirma

function showCustomConfirm(message, onConfirm) {
    // El mensaje ya está fijo en el HTML para este modal específico
    customConfirmModal.classList.add('show');
    confirmCallback = onConfirm; // Guarda la función de callback
}

function hideCustomConfirm() {
    customConfirmModal.classList.remove('show');
    confirmCallback = null; // Limpia el callback
}

// Manejador de clic para el botón "Reiniciar"
function reset(){
  showCustomConfirm('¿Estás seguro de que quieres reiniciar todo el progreso? Esto no se puede deshacer.', () => {
    localStorage.removeItem('aprobados'); // Elimina los datos de aprobados
    aprobados.clear(); // Limpia el conjunto de aprobados
    completedSem.clear(); // Limpia los semestres completados
    completedYear.clear(); // Limpia los años completados
    document.querySelectorAll('.year').forEach(y => y.removeAttribute('data-year-complete')); // Quita el atributo visual de año completo
    updateUI(); // Actualiza la interfaz de usuario
    hideCustomConfirm();
  });
}

// Event listeners para los botones del modal de confirmación
confirmResetYes.addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback();
    }
});

confirmResetNo.addEventListener('click', hideCustomConfirm);

customConfirmModal.addEventListener('click', (e) => {
    if (e.target === customConfirmModal) {
        hideCustomConfirm();
    }
});

// Funciones para el nuevo modal del mensaje del tr._nico
function showTrNicoMessageModal() {
    trNicoMessageModal.classList.add('show');
}

function hideTrNicoMessageModal() {
    trNicoMessageModal.classList.remove('show');
}

// Event listeners para el botón y el modal del mensaje del tr._nico
trNicoInfoBtn.addEventListener('click', showTrNicoMessageModal);
trNicoModalCloseBtn.addEventListener('click', hideTrNicoMessageModal);
trNicoMessageModalCloseButton.addEventListener('click', hideTrNicoMessageModal);
trNicoMessageModal.addEventListener('click', (e) => {
    if (e.target === trNicoMessageModal) {
        hideTrNicoMessageModal();
    }
});

// Funciones de Exportar/Importar Progreso
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify([...aprobados]); // Convierte el Set a Array y luego a String JSON
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'progreso_malla_unach.json';
    document.body.appendChild(a); // Necesario para Firefox
    a.click();
    document.body.removeChild(a); // Limpiar
    URL.revokeObjectURL(url); // Liberar el objeto URL
    showCustomAlert('Progreso exportado exitosamente como "progreso_malla_unach.json"');
});

importBtn.addEventListener('click', () => {
    importFile.click(); // Simula el clic en el input de tipo file
});

importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                aprobados = new Set(importedData);
                set('aprobados', [...aprobados]);
                // Reiniciar estados de semestres/años completados para que se recalcule
                completedSem.clear();
                completedYear.clear();
                document.querySelectorAll('.year').forEach(y => y.removeAttribute('data-year-complete'));
                updateUI();
                showCustomAlert('Progreso importado exitosamente.');
            } else {
                showCustomAlert('El archivo importado no tiene el formato correcto.');
            }
        } catch (error) {
            console.error('Error al parsear el archivo JSON:', error);
            showCustomAlert('Error al importar el progreso. Asegúrate de que el archivo sea un JSON válido.');
        }
    };
    reader.readAsText(file);
});


// Inicialización de la UI al cargar la página
updateUI();
