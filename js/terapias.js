const IMAGENES_TERAPIAS = {
  'masaje-relajante': 'assets/img/masaje-relajante.jpg',
  'drenaje-linfatico': 'assets/img/drenaje-linfatico.jpg',
  'masaje-terapeutico': 'assets/img/masaje-terapeutico.jpg',
  'quiromasaje': 'assets/img/quiromasaje.jpg',
  'reflexologia': 'assets/img/reflexologia.jpg',
  'ventosas': 'assets/img/ventosas.jpg',
  'ajustes-quiropracticos': 'assets/img/ajustes-quiropracticos.jpg',
  'aromaterapia': 'assets/img/aromaterapia.jpg'
};

const IMAGEN_DEFAULT = 'assets/img/terapia-default.jpg';

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('terapias-container')) {
    cargarTerapias();
  }

  if (document.getElementById('terapia-nombre')) {
    cargarDetalleTerapia();
  }
});

function obtenerSlug(terapia) {
  if (terapia.slug) return terapia.slug;

  return terapia.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function obtenerImagenTerapia(terapia) {
  const slug = obtenerSlug(terapia);
  return terapia.imagen_url || IMAGENES_TERAPIAS[slug] || IMAGEN_DEFAULT;
}

function imagenFallback(img) {
  img.onerror = null;
  img.src = IMAGEN_DEFAULT;
}

function quitarDuplicadosPorSlug(terapias) {
  const vistas = new Set();
  const resultado = [];

  terapias.forEach(terapia => {
    const slug = obtenerSlug(terapia);

    if (!vistas.has(slug)) {
      vistas.add(slug);
      resultado.push(terapia);
    }
  });

  return resultado;
}

async function cargarTerapias() {
  const contenedor = document.getElementById('terapias-container');

  const { data, error } = await supabaseClient
    .from('therapies')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    contenedor.innerHTML = `<p>Error al cargar terapias: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>No hay terapias disponibles.</p>';
    return;
  }

  const terapiasSinDuplicados = quitarDuplicadosPorSlug(data);

  contenedor.innerHTML = '';

  terapiasSinDuplicados.forEach(terapia => {
    const slug = obtenerSlug(terapia);
    const imagen = obtenerImagenTerapia(terapia);
    const precio = slug === 'aromaterapia'
      ? terapia.precio || 'Consultar precio'
      : terapia.precio ? `$${terapia.precio} MXN` : 'Consultar precio';
    const card = document.createElement('div');
    card.classList.add('card', 'therapy-card');

    card.innerHTML = `
      <img class="card-img" src="${imagen}" alt="${terapia.nombre}" onerror="imagenFallback(this)">

      <div class="card-body">
        <h3>${terapia.nombre}</h3>
        <p>${terapia.descripcion || ''}</p>
        <p><strong>Duración:</strong> ${terapia.duracion_minutos || 60} minutos</p>
        <p><strong>Precio:</strong> ${precio}</p>
        <a href="terapia-detalle.html?terapia=${slug}">Ver más</a>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

async function cargarDetalleTerapia() {
  const params = new URLSearchParams(window.location.search);

  const terapiaId = params.get('id');
  const terapiaSlug = params.get('terapia');

  const nombre = document.getElementById('terapia-nombre');
  const descripcion = document.getElementById('terapia-descripcion');
  const duracion = document.getElementById('terapia-duracion');
  const precio = document.getElementById('terapia-precio');
  const imagen = document.getElementById('terapia-imagen');
  const botonAgendar = document.getElementById('btn-agendar-terapia');

  if (!terapiaId && !terapiaSlug) {
    nombre.textContent = 'Terapia no encontrada';
    descripcion.textContent = 'No se recibió un identificador de terapia válido.';
    return;
  }

  let query = supabaseClient
    .from('therapies')
    .select('*')
    .eq('activo', true);

  if (terapiaId) {
    query = query.eq('id', terapiaId);
  } else {
    query = query.eq('slug', terapiaSlug);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    nombre.textContent = 'Error al cargar la terapia';
    descripcion.textContent = error ? error.message : 'No se encontró la terapia solicitada.';
    return;
  }

  const slug = obtenerSlug(data);
  const imagenSrc = obtenerImagenTerapia(data);

  document.title = `${data.nombre} - Lombana Therapy`;

  nombre.textContent = data.nombre;
  descripcion.innerHTML = (data.descripcion_larga || data.descripcion || '').replace(/\n/g, '<br>');  duracion.textContent = 'Duración: ' + (data.duracion_minutos || 60) + ' minutos';
  precio.textContent = data.precio
    ? 'Precio: ' + (slug === 'aromaterapia' ? data.precio : '$' + data.precio + ' MXN')
    : 'Precio: consultar disponibilidad';
  if (imagen) {
    imagen.src = imagenSrc;
    imagen.alt = data.nombre;
  }

  if (botonAgendar) {
    botonAgendar.href = `agendar.html?terapia=${slug}`;
  }
}