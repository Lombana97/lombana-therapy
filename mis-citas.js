document.addEventListener('DOMContentLoaded', function () {
  cargarMisCitas();
});

async function cargarMisCitas() {
  const contenedor = document.getElementById('mis-citas-container');

  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    alert('Debes iniciar sesión para ver tus citas.');
    window.location.href = 'login.html?redirect=mis-citas.html';
    return;
  }

  const user = sessionData.session.user;

  const { data, error } = await supabaseClient
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
    contenedor.innerHTML = `<p>Error al cargar citas: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>No tienes citas registradas.</p>';
    return;
  }

  contenedor.innerHTML = '';

  data.forEach(cita => {
    const div = document.createElement('div');
    div.classList.add('admin-box');

    div.innerHTML = `
      <h3>${cita.therapies ? cita.therapies.nombre : 'Terapia'}</h3>
      <p><strong>Fecha:</strong> ${cita.fecha}</p>
      <p><strong>Hora:</strong> ${cita.hora_inicio}</p>
      <p><strong>Estado:</strong> ${cita.status}</p>
    `;

    contenedor.appendChild(div);
  });
}