"use client";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  ContactShadows,
  OrbitControls,
  Center,
} from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import type { Action } from "@/lib/schema";
function Animal({
  url,
  action,
  onClips,
}: {
  url: string;
  action: Action;
  onClips: (clips: string[]) => void;
}) {
  const { scene, animations } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, group);
  useEffect(() => {
    onClips(names);
  }, [names, onClips]);
  useEffect(() => {
    const clip = actions[action] ?? actions.idle;
    if (!clip) return;
    clip.reset().fadeIn(0.4).play();
    return () => {
      clip.fadeOut(0.4);
    };
  }, [action, actions]);
  return (
    <group ref={group}>
      <Center bottom>
        <primitive object={scene} />
      </Center>
    </group>
  );
}
export default function ModelScene({
  url,
  action,
  onClips,
}: {
  url: string;
  action: Action;
  onClips: (clips: string[]) => void;
}) {
  return (
    <Canvas shadows camera={{ position: [0, 1.3, 3.8], fov: 38 }}>
      <color attach="background" args={["#ded9cd"]} />
      <ambientLight intensity={1.7} />
      <directionalLight position={[3, 5, 2]} intensity={3} castShadow />
      <Suspense fallback={null}>
        <Animal url={url} action={action} onClips={onClips} />
        <ContactShadows opacity={0.35} scale={8} blur={2} />
      </Suspense>
      <OrbitControls
        target={[0, 0.65, 0]}
        minDistance={2}
        maxDistance={7}
        maxPolarAngle={Math.PI / 2}
        enablePan={false}
      />
    </Canvas>
  );
}
