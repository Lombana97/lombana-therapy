console.log('Lombana Therapy cargado correctamente.');
/* =========================================
   LÓGICA GLOBAL DEL MENÚ HAMBURGUESA (SIN CONFLICTOS)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const navMenu = document.querySelector('.header .nav');

  if (!header || !navMenu) return;

  // CANDADO: Evita que se duplique el evento si ya se inicializó en el HTML
  if (header.dataset.menuInitialized === 'true') return;
  header.dataset.menuInitialized = 'true';

  // 1. Crear botón hamburguesa si no existe en el HTML
  let hamburgerBtn = document.getElementById('hamburger-btn');
  if (!hamburgerBtn) {
    hamburgerBtn = document.createElement('button');
    hamburgerBtn.type = 'button';
    hamburgerBtn.className = 'hamburger-btn';
    hamburgerBtn.id = 'hamburger-btn';
    hamburgerBtn.setAttribute('aria-label', 'Abrir menú');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.innerHTML = `
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    `;
    header.insertBefore(hamburgerBtn, navMenu);
  }

  // 2. Crear fondo oscuro si no existe en el HTML
  let menuOverlay = document.getElementById('menu-overlay');
  if (!menuOverlay) {
    menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    menuOverlay.id = 'menu-overlay';
    header.insertAdjacentElement('afterend', menuOverlay);
  }

  // Clonamos el botón para limpiar cualquier evento duplicado previo
  const cleanHamburgerBtn = hamburgerBtn.cloneNode(true);
  hamburgerBtn.parentNode.replaceChild(cleanHamburgerBtn, hamburgerBtn);
  hamburgerBtn = cleanHamburgerBtn;

  function toggleMenu(e) {
    e.stopPropagation();
    const isActive = navMenu.classList.contains('active');
    hamburgerBtn.classList.toggle('active', !isActive);
    navMenu.classList.toggle('active', !isActive);
    menuOverlay.classList.toggle('active', !isActive);
    hamburgerBtn.setAttribute('aria-expanded', String(!isActive));
    document.body.style.overflow = !isActive ? 'hidden' : '';
  }

  function closeMenu() {
    hamburgerBtn.classList.remove('active');
    navMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', toggleMenu);
  menuOverlay.addEventListener('click', closeMenu);

  // Cerrar al tocar un enlace (excepto si solo abre el desplegable de Terapias)
  navMenu.addEventListener('click', (e) => {
    const clickedLink = e.target.closest('a, button');
    if (clickedLink) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
      closeMenu();
    }
  });
});