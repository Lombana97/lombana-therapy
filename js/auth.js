async function registrarUsuario(event) {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const genero = document.getElementById('genero').value;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        nombre: nombre,
        telefono: telefono,
        email: email,
        genero: genero,
        rol: 'paciente'
      },
      emailRedirectTo: window.location.origin + '/login.html'
    }
  });

  if (error) {
    alert('Error al registrar: ' + error.message);
    return;
  }

  if (data.user) {
  await supabaseClient
    .from('profiles')
    .upsert({
      id: data.user.id,
      email: email,
      nombre: nombre,
      telefono: telefono,
      genero: genero,
      rol: 'paciente'
    });
  }

  alert('Registro exitoso. Si Supabase te pide confirmar correo, revisa tu email. Después inicia sesión.');
const params = new URLSearchParams(window.location.search);
const redirect = params.get('redirect');

window.location.href = redirect
  ? 'login.html?redirect=' + encodeURIComponent(redirect)
  : 'login.html';}

async function iniciarSesion(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert('Error al iniciar sesión: ' + error.message);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');

  window.location.href = redirect || 'agendar.html';
}
async function cerrarSesion() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert('Error al cerrar sesión: ' + error.message);
    return;
  }

  alert('Sesión cerrada correctamente.');
  window.location.href = 'login.html';
}