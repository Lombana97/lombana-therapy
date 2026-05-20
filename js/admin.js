document.addEventListener('DOMContentLoaded', function () {
  protegerAdmin();
  cargarPreciosTerapias();
});
async function protegerAdmin() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    alert('Debes iniciar sesión.');
    window.location.href = 'login.html';
    return;
  }

  const user = sessionData.session.user;

  const { data: perfil, error } = await supabaseClient
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (error || !perfil || perfil.rol !== 'admin') {
    alert('No tienes permiso para entrar al panel del terapeuta.');
    window.location.href = 'index.html';
    return;
  }

  cargarCitasAdmin();
}

async function generarHorariosDelDia() {
  const fecha = document.getElementById('fecha-admin').value;

  if (!fecha) {
    alert('Selecciona una fecha.');
    return;
  }

  const dia = obtenerDiaSemana(fecha);

  if (dia === 0) {
    alert('El consultorio no abre los domingos.');
    return;
  }

  const horaInicio = 9;
  const horaFin = dia === 6 ? 15 : 18;
  const horarios = [];

  for (let hora = horaInicio; hora < horaFin; hora++) {
    horarios.push({
      fecha: fecha,
      hora_inicio: convertirHora(hora),
      hora_fin: convertirHora(hora + 1),
      disponible: true
    });
  }

  const { error } = await supabaseClient
    .from('available_slots')
    .upsert(horarios, {
      onConflict: 'fecha,hora_inicio',
      ignoreDuplicates: true
    });

  if (error) {
    alert('Error al generar horarios: ' + error.message);
    return;
  }

  alert('Horarios generados correctamente.');
  cargarCitasAdmin();
}

async function cargarCitasAdmin() {
  const tbody = document.getElementById('tabla-citas');
  const fechaFiltro = document.getElementById('fecha-citas')?.value;

  tbody.innerHTML = `
    <tr>
      <td colspan="6">Cargando citas...</td>
    </tr>
  `;

  let query = supabaseClient
    .from('appointments')
    .select(`
      id,
      fecha,
      hora_inicio,
      status,
      therapies (
        nombre
      ),
      profiles (
        nombre,
        telefono
      )
    `)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (fechaFiltro) {
    query = query.eq('fecha', fechaFiltro);
  }

  const { data, error } = await query;

  if (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Error al cargar citas: ${error.message}</td>
      </tr>
    `;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No hay citas registradas.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';

  data.forEach(cita => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${cita.fecha}</td>
      <td>${formatearHora(cita.hora_inicio)}</td>
      <td>${cita.therapies ? cita.therapies.nombre : 'Sin terapia'}</td>
      <td>${cita.profiles ? cita.profiles.nombre : 'Sin paciente'}</td>
      <td>${cita.profiles ? cita.profiles.telefono || '' : ''}</td>
      <td>${cita.status}</td>
      <td>
        <button type="button" class="btn-danger" onclick="eliminarCita('${cita.id}')">
          Eliminar
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

function obtenerDiaSemana(fechaTexto) {
  const fecha = new Date(fechaTexto + 'T00:00:00');
  return fecha.getDay();
}

function convertirHora(hora) {
  return String(hora).padStart(2, '0') + ':00:00';
}

function formatearHora(hora) {
  if (!hora) return '';
  return hora.substring(0, 5);
}
async function eliminarCita(id) {
  const confirmar = confirm('¿Seguro que deseas eliminar esta cita?');

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Error al eliminar cita: ' + error.message);
    return;
  }

  alert('Cita eliminada correctamente.');
  cargarCitasAdmin();
}
async function cargarPreciosTerapias() {
  const contenedor = document.getElementById('lista-precios-terapias');

  if (!contenedor) return;

  const { data, error } = await supabaseClient
    .from('therapies')
    .select('id, nombre, precio')
    .order('nombre', { ascending: true });

  if (error) {
    contenedor.innerHTML = `<p>Error al cargar terapias: ${error.message}</p>`;
    return;
  }

  contenedor.innerHTML = '';

  data.forEach(terapia => {
    const div = document.createElement('div');
    div.classList.add('precio-terapia-row');

    div.innerHTML = `
      <label>${terapia.nombre}</label>
      <input type="text" id="precio-${terapia.id}" value="${terapia.precio || ''}">
      <button type="button" onclick="actualizarPrecioTerapia('${terapia.id}')">
        Guardar
      </button>
    `;

    contenedor.appendChild(div);
  });
}

async function actualizarPrecioTerapia(id) {
  const input = document.getElementById(`precio-${id}`);
  const nuevoPrecio = input.value.trim();

  const { error } = await supabaseClient
    .from('therapies')
    .update({ precio: nuevoPrecio })
    .eq('id', id);

  if (error) {
    alert('Error al actualizar precio: ' + error.message);
    return;
  }

  alert('Precio actualizado correctamente.');
}