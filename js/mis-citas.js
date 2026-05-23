document.addEventListener('DOMContentLoaded', function () {
  cargarMisCitas();
});

async function cargarMisCitas() {
  const contenedor = document.getElementById('mis-citas-container');

  contenedor.innerHTML = '<p>Cargando citas...</p>';

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    alert('Debes iniciar sesión para ver tus citas.');
    window.location.href = 'login.html?redirect=mis-citas.html';
    return;
  }

  const user = sessionData.session.user;

  const { data: citas, error } = await supabaseClient
    .from('appointments')
    .select(`
      id,
      fecha,
      hora_inicio,
      status,
      therapies (
        nombre
      )
    `)
    .eq('user_id', user.id)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error) {
    contenedor.innerHTML = `
      <p>Error al cargar citas: ${error.message}</p>
    `;
    return;
  }

  if (!citas || citas.length === 0) {
    contenedor.innerHTML = '<p>No tienes citas registradas.</p>';
    return;
  }

  contenedor.innerHTML = '';

  citas.forEach(cita => {
    const tarjeta = document.createElement('div');
    tarjeta.classList.add('admin-box');

    const nombreTerapia = cita.therapies?.nombre || 'Terapia';
    const estado = normalizarTexto(cita.status || '');
    const estaCancelada = estado === 'cancelada';

    tarjeta.innerHTML = `
      <h3>${nombreTerapia}</h3>

      <p>
        <strong>Fecha:</strong> ${cita.fecha}
      </p>

      <p>
        <strong>Hora:</strong> ${formatearHora(cita.hora_inicio)}
      </p>

      <p>
        <strong>Estado:</strong> 
        <span class="${estaCancelada ? 'status-cancelada' : 'status-confirmada'}">
          ${estaCancelada ? 'Cancelada' : 'Confirmada'}
        </span>
      </p>

      ${
        estaCancelada
          ? `
            <p>
              <strong>Esta cita fue cancelada.</strong>
            </p>
          `
          : `
            <button
              type="button"
              class="btn-danger"
              onclick="cancelarMiCita('${cita.id}')"
            >
              Cancelar cita
            </button>
          `
      }
    `;

    contenedor.appendChild(tarjeta);
  });
}

async function cancelarMiCita(id) {
  const confirmar = confirm(
    '¿Seguro que deseas cancelar esta cita? El horario quedará disponible nuevamente.'
  );

  if (!confirmar) {
    return;
  }

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    alert('Tu sesión ha expirado. Inicia sesión nuevamente.');
    window.location.href = 'login.html?redirect=mis-citas.html';
    return;
  }

  const user = sessionData.session.user;

  const { data, error } = await supabaseClient
    .from('appointments')
    .update({
      status: 'cancelada'
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .neq('status', 'cancelada')
    .select('id');

  if (error) {
    alert('Error al cancelar la cita: ' + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert('La cita ya estaba cancelada o no pudo ser modificada.');
    cargarMisCitas();
    return;
  }

  alert('Tu cita fue cancelada correctamente.');

  cargarMisCitas();
}

function formatearHora(hora) {
  if (!hora) {
    return '';
  }

  return hora.substring(0, 5);
}

function normalizarTexto(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}