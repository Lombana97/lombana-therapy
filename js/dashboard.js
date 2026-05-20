document.addEventListener('DOMContentLoaded', function () {
  protegerDashboard();
});

async function protegerDashboard() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    alert('Debes iniciar sesión.');
    window.location.href = 'login.html';
    return;
  }

  const user = sessionData.session.user;

  const { data: perfil } = await supabaseClient
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (!perfil || perfil.rol !== 'admin') {
    alert('No tienes permiso para ver el dashboard.');
    window.location.href = 'index.html';
    return;
  }
}

async function cargarDashboard() {
  const inicio = document.getElementById('fecha-inicio').value;
  const fin = document.getElementById('fecha-fin').value;

  if (!inicio || !fin) {
    alert('Selecciona fecha inicio y fecha fin.');
    return;
  }

  const { data, error } = await supabaseClient
    .from('appointments')
    .select(`
      id,
      fecha,
      therapies (
        nombre
      ),
      profiles (
        nombre,
        genero
      )
    `)
    .gte('fecha', inicio)
    .lte('fecha', fin);

  if (error) {
    alert('Error al cargar dashboard: ' + error.message);
    return;
  }

  mostrarMasFrecuente(data, 'terapia-mas-agendada', cita => cita.therapies?.nombre || 'Sin terapia');
  mostrarMasFrecuente(data, 'cliente-mas-frecuente', cita => cita.profiles?.nombre || 'Sin cliente');
  mostrarMasFrecuente(data, 'genero-mas-agenda', cita => cita.profiles?.genero || 'Sin género');
  mostrarMasFrecuente(data, 'dia-mas-agendado', cita => obtenerNombreDia(cita.fecha));
}

function mostrarMasFrecuente(data, elementoId, obtenerValor) {
  const conteo = {};

  data.forEach(item => {
    const valor = obtenerValor(item);
    conteo[valor] = (conteo[valor] || 0) + 1;
  });

  let mayorValor = 'Sin datos';
  let mayorCantidad = 0;

  Object.keys(conteo).forEach(valor => {
    if (conteo[valor] > mayorCantidad) {
      mayorValor = valor;
      mayorCantidad = conteo[valor];
    }
  });

  document.getElementById(elementoId).textContent =
    mayorCantidad > 0 ? `${mayorValor} (${mayorCantidad} citas)` : 'Sin datos';
}

function obtenerNombreDia(fechaTexto) {
  const fecha = new Date(fechaTexto + 'T00:00:00');
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[fecha.getDay()];
}

async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}