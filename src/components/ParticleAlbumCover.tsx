import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ParticleAlbumCoverProps {
  imageUrl: string;
  onDoubleClick?: () => void;
}

export default function ParticleAlbumCover({
  imageUrl,
  onDoubleClick,
}: ParticleAlbumCoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    isDragging: boolean;
    previousMousePosition: { x: number; y: number };
    rotation: { x: number; y: number };
    targetRotation: { x: number; y: number };
    animationId: number | null;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Load texture and create particles
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    let particles: THREE.Points;
    const particleCount = 10000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Load image and extract colors
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = 200;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      const aspect = 1;
      const particlesPerRow = Math.sqrt(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const row = Math.floor(i / particlesPerRow);
        const col = i % particlesPerRow;

        const x = (col / particlesPerRow - 0.5) * 4 * aspect;
        const y = -(row / particlesPerRow - 0.5) * 4;
        const z = (Math.random() - 0.5) * 0.5;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const imgX = Math.floor((col / particlesPerRow) * size);
        const imgY = Math.floor((row / particlesPerRow) * size);
        const pixelIndex = (imgY * size + imgX) * 4;

        colors[i * 3] = data[pixelIndex] / 255;
        colors[i * 3 + 1] = data[pixelIndex + 1] / 255;
        colors[i * 3 + 2] = data[pixelIndex + 2] / 255;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    };

    img.src = imageUrl;

    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotation = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotation.y += deltaX * 0.01;
      targetRotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onDoubleClickHandler = () => {
      targetRotation.x = 0;
      targetRotation.y = 0;
      if (onDoubleClick) onDoubleClick();
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("dblclick", onDoubleClickHandler);

    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);

      // Smooth rotation
      rotation.x += (targetRotation.x - rotation.x) * 0.1;
      rotation.y += (targetRotation.y - rotation.y) * 0.1;

      particles.rotation.x = rotation.x;
      particles.rotation.y = rotation.y;

      renderer.render(scene, camera);

      sceneRef.current = {
        scene,
        camera,
        renderer,
        particles,
        isDragging,
        previousMousePosition,
        rotation,
        targetRotation,
        animationId,
      };
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("dblclick", onDoubleClickHandler);

      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }

      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [imageUrl, onDoubleClick]);

  return <div ref={containerRef} className="particle-album-cover" />;
}
