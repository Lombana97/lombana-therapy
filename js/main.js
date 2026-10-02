console.log('Lombana Therapy cargado correctamente.');
/* =========================================
   LÓGICA GLOBAL DEL MENÚ HAMBURGUESA
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const navMenu = document.querySelector('.header .nav');

  if (!header || !navMenu) return;

  // 1. Si la página no tiene el botón hamburguesa en el HTML, lo inyecta automáticamente a la derecha del logo
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

  // 2. Si la página no tiene el fondo oscuro (overlay), lo crea automáticamente
  let menuOverlay = document.getElementById('menu-overlay');
  if (!menuOverlay) {
    menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    menuOverlay.id = 'menu-overlay';
    header.insertAdjacentElement('afterend', menuOverlay);
  }

  function toggleMenu() {
    const isActive = navMenu.classList.contains('active');
    hamburgerBtn.classList.toggle('active', !isActive);
    navMenu.classList.toggle('active', !isActive);
    menuOverlay.classList.toggle('active', !isActive);
    hamburgerBtn.setAttribute('aria-expanded', !isActive);
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

  // Cerrar el menú al hacer clic en cualquier módulo (Inicio, Citas, Terapias, Agendar, Contacto, Ubicación, Login)
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