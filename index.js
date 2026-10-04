// Menu mobile
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}));

// Apparition au scroll
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add('in'));
}

// Année du footer
document.getElementById('year').textContent = new Date().getFullYear();


// ===== 3D =====
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Effet d'inclinaison 3D (photo + cartes)
document.querySelectorAll('.tilt').forEach(el => {
  const max = el.classList.contains('photo-3d') ? 12 : 8;
  el.addEventListener('pointermove', e => {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateY(${(x - .5) * max * 2}deg) rotateX(${(.5 - y) * max * 2}deg) translateZ(0)`;
    el.style.setProperty('--gx', x * 100 + '%'); el.style.setProperty('--gy', y * 100 + '%');
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

// Scène Three.js en arrière-plan
const canvas = document.getElementById('bg');
if (window.THREE && canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 14;

  const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: o });
  const shapes = [
    [new THREE.IcosahedronGeometry(2.6, 1), 0xe5738a, .35, [5.5, 2, -2]],
    [new THREE.TorusKnotGeometry(1.4, .42, 90, 12), 0x5b7cc9, .30, [-6.5, -2.5, -3]],
    [new THREE.OctahedronGeometry(1.6), 0xe5738a, .30, [-4, 4, -5]],
    [new THREE.TorusGeometry(1.8, .3, 12, 40), 0x5b7cc9, .28, [6.5, -5, -4]]
  ].map(([g, c, o, p]) => { const m = new THREE.Mesh(g, mat(c, o)); m.position.set(...p); scene.add(m); return m; });

  const N = 450, pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - .5) * 40;
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xa3aec4, size: .06, transparent: true, opacity: .7 }));
  scene.add(pts);

  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();

  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  const tick = t => {
    const s = scrollY / 600;
    shapes.forEach((m, i) => { m.rotation.x = t * .0002 * (i + 1) + s; m.rotation.y = t * .00025 * (i + 1); });
    pts.rotation.y = t * .00003 + s * .1;
    camera.position.x += (mx * 2 - camera.position.x) * .04;
    camera.position.y += (-my * 2 - scrollY * .004 - camera.position.y) * .04;
    camera.lookAt(0, camera.position.y * .3, 0);
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(tick);
  };
  reduce ? tick(0) : requestAnimationFrame(tick);
}