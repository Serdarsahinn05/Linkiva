"use client";

import type * as T from "three";
import { useEffect, useRef } from "react";

/**
 * The 404 mascot (DESIGN.md §7 Durum sayfaları): a puffy clay figure holding out a short chain whose last
 * link is broken, "the link is broken". The chain hangs with simple physics (Verlet points and fixed
 * lengths): it sways with the arm, and the pointer pushes it aside as it passes. three.js is loaded only
 * here, lazily; until then (and without WebGL) the box stays empty at its final size, so nothing shifts.
 * Reduced motion: the figure stands still and the chain hangs, the pointer does not move it.
 */
export function LostMascot() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    void (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      let renderer: T.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return; // No WebGL: the page reads fine without the figure.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      // Framed wider than the figure: the chain needs room to swing out to the right.
      camera.position.set(0.75, 0.05, 5.2);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const envMap = pmrem.fromScene(room, 0.04).texture;
      scene.environment = envMap;
      scene.environmentIntensity = 0.8;
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(-3, 4, 5);
      const rim = new THREE.DirectionalLight(0xc8d4ff, 1.4);
      rim.position.set(4, 1, -3);
      scene.add(key, rim);

      const disposables: { dispose: () => void }[] = [];
      const keep = <X extends { dispose: () => void }>(item: X) => {
        disposables.push(item);
        return item;
      };

      const clay = keep(
        new THREE.MeshPhysicalMaterial({
          color: 0xeef0f6,
          roughness: 0.5,
          sheen: 1,
          sheenRoughness: 0.45,
          sheenColor: new THREE.Color(0.75, 0.79, 1),
          clearcoat: 0.25,
          clearcoatRoughness: 0.4,
        }),
      );
      const ink = keep(new THREE.MeshPhysicalMaterial({ color: 0x0b0d12, roughness: 0.12, clearcoat: 1 }));
      const shine = keep(new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const metal = keep(new THREE.MeshPhysicalMaterial({ color: 0xdfe3ec, metalness: 1, roughness: 0.18, clearcoat: 0.5 }));

      const root = new THREE.Group();
      scene.add(root);
      const body = new THREE.Group();
      root.add(body);
      const torso = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.72, 0.55, 16, 48)), clay);
      torso.scale.set(1, 1, 0.88);
      body.add(torso);
      const stalk = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.025, 0.035, 0.32, 12)), clay);
      stalk.position.y = 1.12;
      const bead = new THREE.Mesh(keep(new THREE.SphereGeometry(0.085, 24, 16)), ink);
      bead.position.y = 1.32;
      body.add(stalk, bead);

      // Face: big glossy eyes, brows lifted at the middle and a small lopsided smile: "oops".
      const face = new THREE.Group();
      face.position.set(0, 0.3, 0.62);
      body.add(face);
      const eyeGeometry = keep(new THREE.SphereGeometry(0.115, 32, 16));
      const glint = keep(new THREE.SphereGeometry(0.032, 12, 8));
      const glintSmall = keep(new THREE.SphereGeometry(0.016, 12, 8));
      const eyes = [-0.25, 0.25].map((x) => {
        const eye = new THREE.Mesh(eyeGeometry, ink);
        eye.position.set(x, 0, 0);
        eye.scale.set(1, 1.2, 0.6);
        const big = new THREE.Mesh(glint, shine);
        big.position.set(0.035, 0.05, 0.07);
        const small = new THREE.Mesh(glintSmall, shine);
        small.position.set(-0.035, -0.045, 0.07);
        eye.add(big, small);
        face.add(eye);
        return eye;
      });
      const browGeometry = keep(new THREE.CapsuleGeometry(0.018, 0.1, 6, 12));
      [-1, 1].forEach((side) => {
        const brow = new THREE.Mesh(browGeometry, ink);
        brow.position.set(side * 0.25, 0.2, 0.02);
        brow.rotation.z = Math.PI / 2 - side * 0.35; // the inner ends lifted
        face.add(brow);
      });
      const smile = new THREE.Mesh(keep(new THREE.TorusGeometry(0.06, 0.016, 8, 24, Math.PI * 0.8)), ink);
      smile.position.set(0.02, -0.14, 0.04);
      smile.rotation.z = Math.PI * 1.1 + 0.12;
      face.add(smile);

      const armGeometry = keep(new THREE.CapsuleGeometry(0.1, 0.34, 8, 16));
      const arm = (side: number) => {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.7, 0.08, 0);
        const mesh = new THREE.Mesh(armGeometry, clay);
        mesh.position.y = -0.27;
        pivot.add(mesh);
        body.add(pivot);
        return pivot;
      };
      const armR = arm(1);
      const armL = arm(-1);
      const hand = new THREE.Object3D();
      hand.position.set(0, -0.56, 0.08);
      armR.add(hand);

      const footGeometry = keep(new THREE.SphereGeometry(0.2, 24, 16));
      [0.3, -0.3].forEach((x) => {
        const foot = new THREE.Mesh(footGeometry, clay);
        foot.position.set(x, -1.02, 0.06);
        foot.scale.set(1, 0.55, 1.3);
        root.add(foot);
      });

      // Contact shadow: a soft dark ellipse under the feet.
      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = shadowCanvas.height = 64;
      const sctx = shadowCanvas.getContext("2d");
      if (sctx) {
        const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(0,0,0,0.4)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, 64, 64);
      }
      const shadow = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(1.8, 0.7)),
        keep(new THREE.MeshBasicMaterial({ map: keep(new THREE.CanvasTexture(shadowCanvas)), transparent: true, depthWrite: false })),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -1.15;
      root.add(shadow);

      // The chain: stadium-shaped links swept by a round tube; the last one is open at its free end.
      class StadiumCurve extends THREE.Curve<T.Vector3> {
        constructor(
          private radius: number,
          private straight: number,
          private from = 0,
          private to = 1,
        ) {
          super();
        }
        getPoint(u: number, target = new THREE.Vector3()) {
          const { radius: r, straight: s } = this;
          const arc = Math.PI * r;
          // from/to may run past 1 so a range can wrap through the start of the path.
          let d = ((((this.from + u * (this.to - this.from)) % 1) + 1) % 1) * (2 * s + 2 * arc);
          if (d < s) return target.set(r, -s / 2 + d, 0);
          d -= s;
          if (d < arc) return target.set(r * Math.cos(d / r), s / 2 + r * Math.sin(d / r), 0);
          d -= arc;
          if (d < s) return target.set(-r, s / 2 - d, 0);
          d -= s;
          const a = Math.PI + d / r;
          return target.set(r * Math.cos(a), -s / 2 + r * Math.sin(a), 0);
        }
      }
      const whole = keep(new THREE.TubeGeometry(new StadiumCurve(0.085, 0.11), 80, 0.026, 12, true));
      // Open at the bottom (the free end): the path runs from just past its lowest point (0.823 of the path)
      // all the way round to just before it.
      const brokenPath = new StadiumCurve(0.085, 0.11, 0.893, 1.753);
      const broken = keep(new THREE.TubeGeometry(brokenPath, 80, 0.026, 12, false));
      const capGeometry = keep(new THREE.SphereGeometry(0.026, 12, 8));
      const links = [whole, whole, whole, whole, whole, broken].map((geometry) => {
        const link = new THREE.Mesh(geometry, metal);
        scene.add(link);
        return link;
      });
      const last = links[links.length - 1];
      if (last) {
        for (const u of [0, 1]) {
          const cap = new THREE.Mesh(capGeometry, metal);
          cap.position.copy(brokenPath.getPoint(u));
          last.add(cap);
        }
      }

      // Chain physics: one point per link joint, Verlet steps, fixed spacing. Point 0 follows the hand.
      const PITCH = 0.19;
      const GRAVITY = -12;
      const points = Array.from({ length: links.length + 1 }, () => ({ pos: new THREE.Vector3(), prev: new THREE.Vector3() }));
      const handAt = new THREE.Vector3();
      const settle = () => {
        scene.updateMatrixWorld();
        hand.getWorldPosition(handAt);
        points.forEach((pt, i) => {
          pt.pos.set(handAt.x, handAt.y - i * PITCH, handAt.z);
          pt.prev.copy(pt.pos);
        });
      };

      const size = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Wide: the figure left of centre, room for the chain's swing on the right. Narrow (the figure above the
        // words, centred on the page): the figure and its chain centred.
        const cx = w < 560 ? 0.35 : 0.75;
        camera.position.set(cx, 0.05, 5.2);
        camera.lookAt(cx, 0.05, 0);
        camera.updateProjectionMatrix();
      };
      size();
      const observer = new ResizeObserver(size);
      observer.observe(el);

      // The pointer, as a point on the chain's plane; its motion is what pushes the links.
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ray = new THREE.Raycaster();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.08);
      const ndc = new THREE.Vector2();
      const pointer = { on: false, at: new THREE.Vector3(), last: new THREE.Vector3(), look: { x: 0, y: 0 } };
      const onPointer = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.look = { x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 };
        ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        pointer.on = ray.ray.intersectPlane(plane, pointer.at) !== null;
      };
      const onLeave = () => (pointer.on = false);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);

      const look = { x: 0, y: 0 };
      const dir = new THREE.Vector3();
      const facing = new THREE.Vector3(0, 0, 1);
      const axisX = new THREE.Vector3();
      const axisY = new THREE.Vector3();
      const axisZ = new THREE.Vector3();
      const basis = new THREE.Matrix4();
      const push = new THREE.Vector3();
      const timer = new THREE.Timer();
      let started = false;
      let raf = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden) return;
        timer.update(now);
        const time = timer.getElapsed();
        const dt = Math.min(timer.getDelta(), 1 / 30);

        look.x += (pointer.look.x - look.x) * 0.1;
        look.y += (pointer.look.y - look.y) * 0.1;
        face.position.x = Math.max(-0.07, Math.min(0.07, look.x * 0.12));
        face.position.y = 0.3 - Math.max(-0.08, Math.min(0.08, look.y * 0.15));
        body.rotation.y = Math.max(-0.22, Math.min(0.22, look.x * 0.3));
        const blink = !reduce && time % 3.7 < 0.12 ? 0.12 : 1;
        eyes.forEach((eye) => (eye.scale.y = 1.2 * blink));

        // Right arm held out to the side with the chain; a small idle sway keeps the chain alive.
        armR.rotation.z = reduce ? 1.55 : 1.55 + Math.sin(time * 1.3) * 0.08;
        armL.rotation.z = -0.35 + (reduce ? 0 : Math.sin(time * 1.5) * 0.06);
        body.position.y = reduce ? 0 : Math.sin(time * 2) * 0.025;
        scene.updateMatrixWorld();
        hand.getWorldPosition(handAt);
        if (!started) {
          settle();
          started = true;
        }

        // Physics in small fixed steps: gravity, damping, the pointer's push, then the link lengths.
        const steps = reduce ? 0 : 3;
        const h = dt / Math.max(steps, 1);
        for (let s = 0; s < steps; s++) {
          points.forEach((pt, i) => {
            if (i === 0) return;
            // Damped, and capped so a fast swipe cannot fling the chain round the hand.
            const cap = Math.min(1, 0.015 / (Math.hypot(pt.pos.x - pt.prev.x, pt.pos.y - pt.prev.y, pt.pos.z - pt.prev.z) || 1));
            const vx = (pt.pos.x - pt.prev.x) * 0.985 * cap;
            const vy = (pt.pos.y - pt.prev.y) * 0.985 * cap;
            const vz = (pt.pos.z - pt.prev.z) * 0.985 * cap;
            pt.prev.copy(pt.pos);
            pt.pos.x += vx;
            pt.pos.y += vy + GRAVITY * h * h;
            pt.pos.z += vz;
            if (pointer.on) {
              // Within reach of the pointer a link is pushed out of its way (sideways more than up).
              push.subVectors(pt.pos, pointer.at);
              push.z = 0;
              const dist = push.length();
              const reach = 0.24;
              if (dist < reach && dist > 1e-4) {
                push.multiplyScalar(((reach - dist) / dist) * 0.13);
                push.y *= 0.4;
                pt.pos.add(push);
              }
            }
          });
          const anchor = points[0];
          if (anchor) anchor.pos.copy(handAt);
          for (let k = 0; k < 6; k++) {
            for (let i = 0; i < points.length - 1; i++) {
              const a = points[i];
              const b = points[i + 1];
              if (!a || !b) continue;
              dir.subVectors(b.pos, a.pos);
              const len = dir.length() || 1e-6;
              const diff = (len - PITCH) / len;
              if (i === 0) b.pos.addScaledVector(dir, -diff);
              else {
                a.pos.addScaledVector(dir, diff * 0.5);
                b.pos.addScaledVector(dir, -diff * 0.5);
              }
            }
          }
        }
        if (reduce) points.forEach((pt, i) => pt.pos.set(handAt.x, handAt.y - i * PITCH, handAt.z));

        // Each link sits between its two points, every other one turned a quarter so they interlock.
        links.forEach((link, i) => {
          const a = points[i];
          const b = points[i + 1];
          if (!a || !b) return;
          link.position.addVectors(a.pos, b.pos).multiplyScalar(0.5);
          dir.subVectors(b.pos, a.pos).normalize();
          // A steady frame: the link's long axis along the chain, its face toward the viewer (every other one
          // edge-on), so a swing never spins a link round its own axis.
          axisY.copy(dir).negate();
          axisX.crossVectors(axisY, facing).normalize();
          axisZ.crossVectors(axisX, axisY);
          if (i % 2) basis.makeBasis(axisZ, axisY, axisX.negate());
          else basis.makeBasis(axisX, axisY, axisZ);
          link.quaternion.setFromRotationMatrix(basis);
        });

        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        disposables.forEach((item) => item.dispose());
        envMap.dispose();
        room.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Wider than the figure, with the figure on its left: the room on the right is for the chain's swing.
  return <div ref={host} aria-hidden className="aspect-[5/4] w-full max-w-96 shrink-0 sm:max-w-[30rem] md:w-[min(44rem,46vw)] md:max-w-none [&>canvas]:block [&>canvas]:size-full" />;
}
