let horarioSeleccionado = null;
let terapiasAgenda = [];
let usuarioActual = null;

const paramsAgenda = new URLSearchParams(window.location.search);
const terapiaPreseleccionada = paramsAgenda.get('terapia');

document.addEventListener('DOMContentLoaded', async function () {
  const autorizado = await protegerAgenda();

  if (!autorizado) {
    return;
  }

  configurarFechaMinima();
  await cargarTerapiasAgenda();

  const fechaInput = document.getElementById('fecha');

  if (fechaInput) {
    fechaInput.addEventListener('change', cargarHorariosDisponibles);
  }
});

async function protegerAgenda() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error('Error al obtener sesión:', error);
    alert('Ocurrió un error al verificar tu sesión. Inicia sesión nuevamente.');

    const regreso = encodeURIComponent(
      window.location.pathname.split('/').pop() + window.location.search
    );

    window.location.replace('login.html?redirect=' + regreso);
    return false;
  }

  if (!data || !data.session || !data.session.user) {
    alert('Debes iniciar sesión para agendar una cita.');

    const regreso = encodeURIComponent(
      window.location.pathname.split('/').pop() + window.location.search
    );

    window.location.replace('login.html?redirect=' + regreso);
    return false;
  }

  usuarioActual = data.session.user;
  return true;
}

function configurarFechaMinima() {
  const fechaInput = document.getElementById('fecha');

  if (!fechaInput) {
    return;
  }

  const hoy = obtenerFechaActualTexto();

  fechaInput.min = hoy;

  if (fechaInput.value && fechaInput.value < hoy) {
    fechaInput.value = '';
  }
}

function obtenerFechaActualTexto() {
  const ahora = new Date();

  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function obtenerSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function cargarTerapiasAgenda() {
  const select = document.getElementById('terapia');

  if (!select) {
    console.error('No se encontró el select con id="terapia".');
    return;
  }

  select.innerHTML = '<option value="">Cargando terapias...</option>';

  const { data, error } = await supabaseClient
    .from('therapies')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al cargar terapias:', error);
    select.innerHTML = `<option value="">Error: ${error.message}</option>`;
    return;
  }

  terapiasAgenda = data || [];
  select.innerHTML = '<option value="">Selecciona una terapia</option>';

  terapiasAgenda.forEach(terapia => {
    const option = document.createElement('option');

    option.value = terapia.id;
    option.dataset.slug = terapia.slug || obtenerSlug(terapia.nombre);
    option.textContent = `${terapia.nombre} - $${terapia.precio || 400} MXN`;

    select.appendChild(option);
  });

  if (terapiaPreseleccionada) {
    const terapia = terapiasAgenda.find(item => {
      return (item.slug || obtenerSlug(item.nombre)) === terapiaPreseleccionada;
    });

    if (terapia) {
      select.value = terapia.id;
    }
  }
}

async function cargarHorariosDisponibles() {
  const autorizado = await protegerAgenda();

  if (!autorizado) {
    return;
  }

  const fechaInput = document.getElementById('fecha');
  const contenedor = document.getElementById('horarios');

  if (!fechaInput || !contenedor) {
    console.error('No se encontró el input fecha o el contenedor horarios.');
    return;
  }

  const fecha = fechaInput.value;

  horarioSeleccionado = null;
  contenedor.innerHTML = '';

  if (!fecha) {
    contenedor.innerHTML = '<p>Selecciona una fecha.</p>';
    return;
  }

  if (fechaEsAnteriorAHoy(fecha)) {
    fechaInput.value = '';
    contenedor.innerHTML = '<p>No puedes agendar citas en fechas anteriores a hoy.</p>';
    alert('No puedes agendar citas en fechas anteriores a hoy.');
    return;
  }

  const dia = obtenerDiaSemana(fecha);

  if (dia === 0) {
    contenedor.innerHTML = '<p>El consultorio no abre los domingos.</p>';
    return;
  }

  contenedor.innerHTML = '<p>Cargando horarios...</p>';

  const horariosDelDia = generarHorariosPorFecha(fecha);

  const horariosVigentes = horariosDelDia.filter(horario => {
    return !horarioYaPaso(horario);
  });

  if (horariosVigentes.length === 0) {
    contenedor.innerHTML = '<p>Ya no hay horarios disponibles para este día.</p>';
    return;
  }

  const { data: citasExistentes, error } = await supabaseClient
    .from('appointments')
    .select('hora_inicio, status')
    .eq('fecha', fecha)
    .neq('status', 'cancelada');

  if (error) {
    console.error('Error al consultar citas existentes:', error);
    contenedor.innerHTML = `<p>Error al cargar horarios: ${error.message}</p>`;
    return;
  }

  const horasOcupadas = (citasExistentes || []).map(cita => {
    return formatearHora(cita.hora_inicio);
  });

  contenedor.innerHTML = '';

  horariosVigentes.forEach(horario => {
    const button = document.createElement('button');

    button.type = 'button';
    button.classList.add('slot-btn');

    const horaInicioCorta = formatearHora(horario.hora_inicio);

    if (horasOcupadas.includes(horaInicioCorta)) {
      button.disabled = true;
      button.classList.add('slot-disabled');
      button.textContent = horaInicioCorta + ' - Ocupado';
    } else {
      button.textContent = horaInicioCorta;

      button.onclick = function () {
        seleccionarHorario(horario, button);
      };
    }

    contenedor.appendChild(button);
  });

  const horariosLibres = horariosVigentes.filter(horario => {
    return !horasOcupadas.includes(formatearHora(horario.hora_inicio));
  });

  if (horariosLibres.length === 0) {
    contenedor.insertAdjacentHTML(
      'beforeend',
      '<p>Todos los horarios disponibles de este día ya están ocupados.</p>'
    );
  }
}

function generarHorariosPorFecha(fecha) {
  const dia = obtenerDiaSemana(fecha);

  let horaInicio = 9;
  let horaFin = 18;

  if (dia === 6) {
    horaFin = 15;
  }

  const horarios = [];

  for (let hora = horaInicio; hora < horaFin; hora++) {
    horarios.push({
      fecha: fecha,
      hora_inicio: String(hora).padStart(2, '0') + ':00:00',
      hora_fin: String(hora + 1).padStart(2, '0') + ':00:00'
    });
  }

  return horarios;
}

function seleccionarHorario(horario, button) {
  if (horarioYaPaso(horario)) {
    alert('Este horario ya no está disponible porque la hora ya pasó.');
    cargarHorariosDisponibles();
    return;
  }

  horarioSeleccionado = horario;

  document.querySelectorAll('.slot-btn').forEach(btn => {
    btn.classList.remove('selected');
  });

  button.classList.add('selected');
}

async function confirmarCita() {
  const autorizado = await protegerAgenda();

  if (!autorizado) {
    return;
  }

  const terapiaSelect = document.getElementById('terapia');

  if (!terapiaSelect) {
    alert('No se encontró el campo de terapia.');
    return;
  }

  const terapiaId = terapiaSelect.value;

  if (!terapiaId) {
    alert('Selecciona una terapia.');
    return;
  }

  if (!horarioSeleccionado) {
    alert('Selecciona un horario disponible.');
    return;
  }

  if (fechaEsAnteriorAHoy(horarioSeleccionado.fecha)) {
    alert('No puedes agendar citas en fechas anteriores a hoy.');
    horarioSeleccionado = null;
    cargarHorariosDisponibles();
    return;
  }

  if (horarioYaPaso(horarioSeleccionado)) {
    alert('Este horario ya pasó. Selecciona otro horario disponible.');
    horarioSeleccionado = null;
    cargarHorariosDisponibles();
    return;
  }

  const user = usuarioActual;

  if (!user || !user.id) {
    alert('Tu sesión no es válida. Inicia sesión nuevamente.');
    window.location.replace('login.html');
    return;
  }

  const { data: citaDuplicada, error: duplicadaError } = await supabaseClient
    .from('appointments')
    .select('id')
    .eq('fecha', horarioSeleccionado.fecha)
    .eq('hora_inicio', horarioSeleccionado.hora_inicio)
    .neq('status', 'cancelada')
    .maybeSingle();

  if (duplicadaError) {
    console.error('Error al validar horario:', duplicadaError);
    alert('No se pudo validar el horario. Intenta de nuevo.');
    return;
  }

  if (citaDuplicada) {
    alert('Ese horario ya fue reservado. Selecciona otro horario.');
    await cargarHorariosDisponibles();
    return;
  }

  /*
    Se valida nuevamente justo antes de insertar,
    por si el usuario dejó abierta la página varios minutos.
  */
  if (horarioYaPaso(horarioSeleccionado)) {
    alert('El horario seleccionado acaba de vencer. Selecciona otro horario.');
    horarioSeleccionado = null;
    cargarHorariosDisponibles();
    return;
  }

  const { error: citaError } = await supabaseClient
    .from('appointments')
    .insert({
      user_id: user.id,
      therapy_id: terapiaId,
      slot_id: null,
      fecha: horarioSeleccionado.fecha,
      hora_inicio: horarioSeleccionado.hora_inicio,
      hora_fin: horarioSeleccionado.hora_fin,
      status: 'confirmada'
    });

  if (citaError) {
    console.error('Error al confirmar cita:', citaError);
    alert('Error al confirmar la cita: ' + citaError.message);
    return;
  }

  alert(
    'Cita confirmada para el día ' +
    horarioSeleccionado.fecha +
    ' en el horario ' +
    formatearHora(horarioSeleccionado.hora_inicio) +
    '.\n\nFavor de llegar 10 minutos antes de su cita.'
  );

  window.location.reload();
}

function fechaEsAnteriorAHoy(fechaTexto) {
  const hoy = obtenerFechaActualTexto();

  return fechaTexto < hoy;
}

function horarioYaPaso(horario) {
  if (!horario || !horario.fecha || !horario.hora_inicio) {
    return true;
  }

  const fechaHoraInicio = construirFechaHoraLocal(
    horario.fecha,
    horario.hora_inicio
  );

  const ahora = new Date();

  return fechaHoraInicio <= ahora;
}

function construirFechaHoraLocal(fechaTexto, horaTexto) {
  const partesFecha = fechaTexto.split('-');
  const partesHora = horaTexto.split(':');

  const anio = Number(partesFecha[0]);
  const mes = Number(partesFecha[1]) - 1;
  const dia = Number(partesFecha[2]);

  const hora = Number(partesHora[0]);
  const minutos = Number(partesHora[1] || 0);
  const segundos = Number(partesHora[2] || 0);

  return new Date(anio, mes, dia, hora, minutos, segundos);
}

async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  window.location.replace('login.html');
}

function obtenerDiaSemana(fechaTexto) {
  const fecha = new Date(fechaTexto + 'T00:00:00');
  return fecha.getDay();
}

function formatearHora(hora) {
  if (!hora) {
    return '';
  }

  return hora.substring(0, 5);
}