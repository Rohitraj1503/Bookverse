import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Generates an elegant fallback canvas texture with gold embossed BookVerse branding
 */
function createFallbackCoverTexture(title = 'BookVerse', author = 'Editorial') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  // Midnight Dark Gradient Background
  const grad = ctx.createLinearGradient(0, 0, 256, 384);
  grad.addColorStop(0, '#161324');
  grad.addColorStop(0.5, '#0e0c18');
  grad.addColorStop(1, '#08070d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 384);

  // Gold Embossed Border
  ctx.strokeStyle = 'rgba(240, 185, 11, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 364);

  // Inner subtle accent frame
  ctx.strokeStyle = 'rgba(240, 185, 11, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, 224, 352);

  // Left spine ribbon
  const spineGrad = ctx.createLinearGradient(0, 0, 12, 384);
  spineGrad.addColorStop(0, 'rgba(240, 185, 11, 0.8)');
  spineGrad.addColorStop(1, 'rgba(212, 175, 55, 0.2)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(0, 0, 12, 384);

  // Top BookVerse badge
  ctx.fillStyle = '#F0B90B';
  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';
  ctx.fillText('✦ BOOKVERSE ✦', 128, 48);

  // Book Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';

  const cleanTitle = title.length > 28 ? title.slice(0, 25) + '...' : title;
  ctx.fillText(cleanTitle, 128, 170);

  // Author
  ctx.fillStyle = '#B7B7B7';
  ctx.font = '14px "Inter", sans-serif';
  const cleanAuthor = author.length > 24 ? author.slice(0, 22) + '...' : author;
  ctx.fillText(cleanAuthor, 128, 210);

  // Bottom gold emblem
  ctx.fillStyle = 'rgba(240, 185, 11, 0.6)';
  ctx.font = '16px serif';
  ctx.fillText('⚜', 128, 330);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates back cover texture
 */
function createBackCoverTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, 128, 192);

  ctx.strokeStyle = 'rgba(240, 185, 11, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, 116, 180);

  ctx.fillStyle = 'rgba(240, 185, 11, 0.4)';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BOOKVERSE', 64, 96);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const BookCycloneScene = ({ books = [], isEntering = false, onEnterComplete }) => {
  const mountRef = useRef(null);
  const isEnteringRef = useRef(isEntering);
  isEnteringRef.current = isEntering;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    const canvasCheck = document.createElement('canvas');
    const hasWebGL = !!(
      window.WebGLRenderingContext &&
      (canvasCheck.getContext('webgl') || canvasCheck.getContext('experimental-webgl'))
    );

    if (!hasWebGL) {
      console.warn('WebGL is not supported on this device. Fallback mode enabled.');
      return;
    }

    let animationFrameId;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.022);

    // Camera
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 25);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    // Shared Materials
    const pageEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6f3ea,
      roughness: 0.9,
      metalness: 0.05,
    });
    const spineMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.4,
      metalness: 0.6,
    });
    const backCoverTexture = createBackCoverTexture();
    const backCoverMaterial = new THREE.MeshStandardMaterial({
      map: backCoverTexture,
      roughness: 0.5,
      metalness: 0.2,
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x282319, 1.2);
    scene.add(ambientLight);

    const centralLight = new THREE.PointLight(0xf0b90b, 4.0, 50, 1.2);
    centralLight.position.set(0, 0, 0);
    scene.add(centralLight);

    const topRimLight = new THREE.DirectionalLight(0xffd34d, 1.8);
    topRimLight.position.set(10, 20, 12);
    scene.add(topRimLight);

    const purpleAccentLight = new THREE.PointLight(0x8b5cf6, 1.5, 40);
    purpleAccentLight.position.set(-15, -8, -10);
    scene.add(purpleAccentLight);

    // Atmospheric Golden Particles
    const particleCount = 650;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3 + Math.random() * 26;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 28;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      particleScales[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf0b90b,
      size: 0.18,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Book Geometry
    const bookGeom = new THREE.BoxGeometry(1.4, 2.1, 0.2);

    // Setup 3-Layer Cyclone Rings
    const layers = [
      { id: 'inner', radius: 6.8, heightRange: 4.5, speed: 0.0075, count: 10, offset: 0 },
      { id: 'middle', radius: 12.8, heightRange: 8.5, speed: -0.0042, count: 18, offset: 10 },
      { id: 'outer', radius: 19.5, heightRange: 13.0, speed: 0.0024, count: 26, offset: 28 },
    ];

    const bookObjects = [];
    const sourceBooks = Array.isArray(books) && books.length > 0 ? books : [];

    layers.forEach((layer) => {
      const group = new THREE.Group();
      scene.add(group);

      for (let i = 0; i < layer.count; i++) {
        const bookIndex = (layer.offset + i) % (sourceBooks.length || 1);
        const bookData = sourceBooks[bookIndex] || {
          title: `Volume ${layer.offset + i + 1}`,
          author: 'BookVerse Selection',
        };

        const fallbackTexture = createFallbackCoverTexture(bookData.title, bookData.author);
        const frontCoverMaterial = new THREE.MeshStandardMaterial({
          map: fallbackTexture,
          roughness: 0.35,
          metalness: 0.2,
        });

        // Load real cover if URL exists
        const coverUrl = bookData.coverUrl || bookData.cover;
        if (coverUrl && typeof coverUrl === 'string' && !coverUrl.includes('via.placeholder')) {
          textureLoader.load(
            coverUrl,
            (loadedTex) => {
              loadedTex.colorSpace = THREE.SRGBColorSpace;
              frontCoverMaterial.map = loadedTex;
              frontCoverMaterial.needsUpdate = true;
            },
            undefined,
            () => {
              // Gracefully keep fallbackTexture on network failure
            }
          );
        }

        // Materials array: [right, left, top, bottom, front, back]
        const bookMaterials = [
          pageEdgeMaterial, // right edge
          spineMaterial, // left spine
          pageEdgeMaterial, // top edge
          pageEdgeMaterial, // bottom edge
          frontCoverMaterial, // front cover
          backCoverMaterial, // back cover
        ];

        const mesh = new THREE.Mesh(bookGeom, bookMaterials);

        // Position on spiral helix
        const fraction = i / layer.count;
        const angle = fraction * Math.PI * 2;
        const y = (fraction - 0.5) * layer.heightRange;
        const currentRadius = layer.radius + y * 0.28; // Tapering cone

        mesh.position.set(Math.cos(angle) * currentRadius, y, Math.sin(angle) * currentRadius);

        // Face tangent to the orbital path and tilted outward toward camera
        mesh.rotation.y = -angle + Math.PI / 2 + 0.15;
        mesh.rotation.x = 0.12;
        mesh.rotation.z = Math.sin(angle) * 0.08;

        mesh.userData = {
          baseX: mesh.position.x,
          baseY: mesh.position.y,
          baseZ: mesh.position.z,
          currentRadius,
          angle,
          layerSpeed: layer.speed,
        };

        group.add(mesh);
        bookObjects.push(mesh);
      }

      layer.group = group;
    });

    // Central Glowing Identity Ring
    const torusGeom = new THREE.TorusGeometry(3.2, 0.05, 16, 100);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0xf0b90b,
      transparent: true,
      opacity: 0.35,
    });
    const centralRing = new THREE.Mesh(torusGeom, torusMat);
    centralRing.rotation.x = Math.PI / 2.2;
    scene.add(centralRing);

    // Mouse Parallax Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 1.8;

    const onMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = normX;
      mouseY = normY;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Handle Window Resize
    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', onResize);

    // Reduced Motion Preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Animation Loop
    let clock = new THREE.Clock();
    let warpVelocity = 0;
    let enterCompleted = false;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (document.hidden) return;

      const delta = clock.getDelta();

      // Rotate Orbital Layers
      if (!prefersReducedMotion) {
        layers.forEach((layer) => {
          if (layer.group) {
            layer.group.rotation.y += layer.speed * (isEnteringRef.current ? 3.5 : 1.0);
          }
        });

        // Swirl particles
        particles.rotation.y += 0.0012;
        centralRing.rotation.z += 0.005;
      }

      // Handle Enter Warp Transition
      if (isEnteringRef.current) {
        warpVelocity += 0.35;
        camera.position.z -= warpVelocity * delta * 12;

        // Push books radially outward like passing through hyperspace
        bookObjects.forEach((mesh) => {
          mesh.position.x *= 1.03;
          mesh.position.z *= 1.03;
          mesh.scale.multiplyScalar(1.015);
        });

        centralLight.intensity = Math.min(centralLight.intensity + 0.15, 14);

        if (camera.position.z <= -8 && !enterCompleted) {
          enterCompleted = true;
          if (onEnterComplete) {
            onEnterComplete();
          }
        }
      } else {
        // Smooth Idle Parallax
        targetCameraX = mouseX * 2.2;
        targetCameraY = 1.8 + mouseY * 1.4;

        camera.position.x += (targetCameraX - camera.position.x) * 0.04;
        camera.position.y += (targetCameraY - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Clean up on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);

      // Dispose Geometries and Materials
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });

      torusGeom.dispose();
      torusMat.dispose();
      bookGeom.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      backCoverTexture.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [books, onEnterComplete]);

  return (
    <div
      ref={mountRef}
      className="landing-3d-canvas-container"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    />
  );
};

export default BookCycloneScene;
