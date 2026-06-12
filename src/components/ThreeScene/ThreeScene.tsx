import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CasePart } from './caseModel';

interface ThreeSceneProps {
  selectedPartId: string | null;
  onPartSelect: (partId: string | null) => void;
  parts: CasePart[];
}

export default function ThreeScene({ selectedPartId, onPartSelect, parts }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const partMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = useRef<number>(0);

  const createPartMesh = useCallback((part: CasePart): THREE.Mesh => {
    let geometry: THREE.BufferGeometry;
    
    switch (part.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(...part.scale);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(part.scale[0], 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(part.scale[0], part.scale[0], part.scale[1], 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(part.scale[0], part.scale[1], 16, 100);
        break;
      default:
        geometry = new THREE.BoxGeometry(...part.scale);
    }

    const material = new THREE.MeshPhongMaterial({
      color: part.color,
      shininess: 100,
      transparent: true,
      opacity: 0.95,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...part.position);
    mesh.rotation.set(...part.rotation);
    mesh.userData = { partId: part.id };

    return mesh;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f9ff);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 3, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x4a90d9, 0.5);
    pointLight1.position.set(-3, 2, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 0.3);
    pointLight2.position.set(3, -2, -3);
    scene.add(pointLight2);

    const gridHelper = new THREE.GridHelper(10, 10, 0x93c5fd, 0xe0f2fe);
    gridHelper.position.y = -0.8;
    scene.add(gridHelper);

    parts.forEach((part) => {
      const mesh = createPartMesh(part);
      scene.add(mesh);
      partMeshesRef.current.set(part.id, mesh);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const meshes = Array.from(partMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const clickedPartId = intersects[0].object.userData.partId;
        onPartSelect(clickedPartId === selectedPartId ? null : clickedPartId);
      } else {
        onPartSelect(null);
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    const currentRenderer = renderer;
    const currentContainer = containerRef.current;
    
    return () => {
      window.removeEventListener('resize', handleResize);
      currentRenderer.domElement.removeEventListener('click', onMouseClick);
      cancelAnimationFrame(animationFrameRef.current);
      partMeshesRef.current.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      currentRenderer.dispose();
      currentContainer?.removeChild(currentRenderer.domElement);
    };
  }, [parts, createPartMesh, onPartSelect, selectedPartId]);

  useEffect(() => {
    partMeshesRef.current.forEach((mesh, partId) => {
      const material = mesh.material as THREE.MeshPhongMaterial;
      if (partId === selectedPartId) {
        material.emissive = new THREE.Color(0x3b82f6);
        material.emissiveIntensity = 0.5;
        mesh.scale.setScalar(1.05);
      } else {
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
        const part = parts.find(p => p.id === partId);
        if (part) {
          mesh.scale.set(...part.scale);
        }
      }
    });
  }, [selectedPartId, parts]);

  useEffect(() => {
    parts.forEach((part) => {
      const mesh = partMeshesRef.current.get(part.id);
      if (mesh) {
        const targetPosition = part.disassembled
          ? [
              part.position[0] + part.disassembleOffset[0],
              part.position[1] + part.disassembleOffset[1],
              part.position[2] + part.disassembleOffset[2],
            ]
          : part.position;

        mesh.position.lerp(new THREE.Vector3(...targetPosition), 0.1);
      }
    });
  }, [parts]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden bg-theme-bg"
    />
  );
}