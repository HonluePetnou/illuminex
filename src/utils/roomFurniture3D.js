/**
 * roomFurniture3D.js
 * Génère le mobilier Three.js selon le type de pièce.
 * THREE est toujours passé en paramètre — pas d'import global.
 */

const HEX = {
  wood:      0x8B6340, woodDark:  0x5C3A1E, woodLight: 0xC49A6C,
  metal:     0x9E9E9E, white:     0xF5F5F5, grey:      0x78909C,
  greyDark:  0x546E7A, blue:      0x1565C0, fabric:    0x607D8B,
  green:     0x388E3C, black:     0x212121,
};

function mat(THREE, hex, roughness = 0.75, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
}

function box(THREE, w, h, d, hex, x, y, z, rx = 0, ry = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat(THREE, hex)
  );
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addToScene(scene, ...meshes) {
  meshes.forEach(m => scene.add(m));
}

// ─── Bureau ─────────────────────────────────────────────────────────────────
export function addBureauFurniture(scene, THREE, L, W, H) {
  const meshes = [];

  // Bureau principal (contre mur gauche)
  const desk = box(THREE, 1.4, 0.06, 0.7, HEX.woodLight, 0.9, 0.76, W * 0.35);
  // Pieds bureau
  const legH = 0.75;
  [[0.25, 0.15], [1.55, 0.15], [0.25, 0.55], [1.55, 0.55]].forEach(([px, pz]) => {
    meshes.push(box(THREE, 0.05, legH, 0.05, HEX.metal, px - 0.3 + 0.9, legH / 2, W * 0.35 - 0.35 + pz));
  });
  meshes.push(desk);

  // Moniteur sur le bureau
  const monitor = box(THREE, 0.55, 0.35, 0.04, HEX.black, 0.9, 1.12, W * 0.35 - 0.18);
  const monitorBase = box(THREE, 0.15, 0.02, 0.2, HEX.greyDark, 0.9, 0.79, W * 0.35 - 0.18);
  const monitorArm = box(THREE, 0.03, 0.28, 0.03, HEX.greyDark, 0.9, 0.95, W * 0.35 - 0.18);
  monitor.material = new THREE.MeshStandardMaterial({ color: HEX.black, emissive: 0x1a2a6c, emissiveIntensity: 0.3 });
  meshes.push(monitor, monitorBase, monitorArm);

  // Chaise bureau
  const chairSeat = box(THREE, 0.55, 0.06, 0.55, HEX.fabric, 0.9, 0.47, W * 0.35 + 0.65);
  const chairBack = box(THREE, 0.55, 0.45, 0.06, HEX.fabric, 0.9, 0.72, W * 0.35 + 0.92);
  const chairBase = box(THREE, 0.1, 0.44, 0.1, HEX.metal, 0.9, 0.22, W * 0.35 + 0.65, 0, 0);
  meshes.push(chairSeat, chairBack, chairBase);

  // Bibliothèque (contre mur droit)
  const bib = box(THREE, 0.35, 1.8, 1.0, HEX.woodDark, L - 0.25, 0.9, W * 0.6);
  // Étagères
  for (let i = 0; i < 4; i++) {
    meshes.push(box(THREE, 0.33, 0.03, 0.96, HEX.wood, L - 0.25, 0.4 + i * 0.44, W * 0.6));
  }
  meshes.push(bib);

  addToScene(scene, ...meshes);
  return meshes;
}

// ─── Salon ───────────────────────────────────────────────────────────────────
export function addSalonFurniture(scene, THREE, L, W, H) {
  const meshes = [];
  const cx = L / 2, cz = W / 2;

  // Canapé 3 places
  const canape = box(THREE, 2.1, 0.45, 0.85, HEX.fabric, cx, 0.225, W - 1.2);
  const canapeBack = box(THREE, 2.1, 0.6, 0.25, HEX.fabric, cx, 0.52, W - 0.82);
  const canapeL = box(THREE, 0.25, 0.6, 0.85, HEX.fabric, cx - 1.0, 0.3, W - 1.2);
  const canapeR = box(THREE, 0.25, 0.6, 0.85, HEX.fabric, cx + 1.0, 0.3, W - 1.2);
  meshes.push(canape, canapeBack, canapeL, canapeR);

  // Table basse
  const table = box(THREE, 1.0, 0.04, 0.55, HEX.woodLight, cx, 0.36, cz + 0.5);
  const [tl1, tl2, tl3, tl4] = [
    box(THREE, 0.04, 0.34, 0.04, HEX.metal, cx - 0.46, 0.17, cz + 0.25),
    box(THREE, 0.04, 0.34, 0.04, HEX.metal, cx + 0.46, 0.17, cz + 0.25),
    box(THREE, 0.04, 0.34, 0.04, HEX.metal, cx - 0.46, 0.17, cz + 0.73),
    box(THREE, 0.04, 0.34, 0.04, HEX.metal, cx + 0.46, 0.17, cz + 0.73),
  ];
  meshes.push(table, tl1, tl2, tl3, tl4);

  // Télé sur mur (z=0)
  const tv = box(THREE, 1.2, 0.68, 0.06, HEX.black, cx, H * 0.45, 0.06);
  tv.material = new THREE.MeshStandardMaterial({ color: HEX.black, emissive: 0x0d47a1, emissiveIntensity: 0.2 });
  const tvStand = box(THREE, 0.5, 0.4, 0.3, HEX.woodDark, cx, 0.2, 0.18);
  meshes.push(tv, tvStand);

  // Plante d'intérieur
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.3, 12), mat(THREE, HEX.greyDark));
  pot.position.set(L - 0.3, 0.15, 0.4);
  pot.castShadow = true;
  const plant = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), mat(THREE, HEX.green, 0.9));
  plant.position.set(L - 0.3, 0.55, 0.4);
  plant.castShadow = true;
  meshes.push(pot, plant);

  addToScene(scene, ...meshes);
  return meshes;
}

// ─── Salle de classe ─────────────────────────────────────────────────────────
export function addClasseFurniture(scene, THREE, L, W, H) {
  const meshes = [];
  const rows = 3, cols = Math.min(4, Math.floor(L / 1.3));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 0.8 + c * (L - 1.2) / Math.max(cols - 1, 1);
      const z = W * 0.35 + r * (W * 0.45) / Math.max(rows - 1, 1);
      // Table élève
      meshes.push(box(THREE, 0.6, 0.04, 0.45, HEX.woodLight, x, 0.74, z));
      // Chaise
      meshes.push(box(THREE, 0.4, 0.04, 0.4, HEX.blue, x, 0.44, z + 0.35));
      meshes.push(box(THREE, 0.4, 0.4, 0.04, HEX.blue, x, 0.64, z + 0.54));
    }
  }
  // Bureau prof (fond)
  meshes.push(box(THREE, 1.4, 0.06, 0.6, HEX.woodDark, L / 2, 0.76, 0.55));
  // Tableau (mur z=0)
  const blackboard = box(THREE, Math.min(L * 0.7, 2.5), 0.9, 0.04, 0x1B5E20, L / 2, H * 0.55, 0.04);
  blackboard.material = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.95 });
  meshes.push(blackboard);

  addToScene(scene, ...meshes);
  return meshes;
}

// ─── Commerce ────────────────────────────────────────────────────────────────
export function addCommerceFurniture(scene, THREE, L, W, H) {
  const meshes = [];

  // Gondoles (étagères)
  for (let i = 0; i < 2; i++) {
    const z = W * 0.35 + i * W * 0.3;
    const gond = box(THREE, L * 0.65, 1.5, 0.35, HEX.grey, L * 0.4, 0.75, z);
    meshes.push(gond);
    for (let sh = 0; sh < 4; sh++) {
      meshes.push(box(THREE, L * 0.65, 0.03, 0.33, HEX.white, L * 0.4, 0.35 + sh * 0.38, z));
    }
  }

  // Comptoir caisse
  const counter = box(THREE, 0.8, 0.9, 0.6, HEX.woodDark, L - 0.6, 0.45, 0.5);
  meshes.push(counter);

  addToScene(scene, ...meshes);
  return meshes;
}

// ─── Chambre ─────────────────────────────────────────────────────────────────
export function addChambreFurniture(scene, THREE, L, W, H) {
  const meshes = [];

  // Lit
  const bed = box(THREE, 1.6, 0.28, 2.0, HEX.wood, 0.9, 0.14, W * 0.55);
  const mattress = box(THREE, 1.55, 0.18, 1.95, HEX.white, 0.9, 0.37, W * 0.55);
  const pillow = box(THREE, 0.55, 0.1, 0.4, HEX.white, 0.63, 0.52, W * 0.55 - 0.78);
  const pillow2 = box(THREE, 0.55, 0.1, 0.4, HEX.white, 1.17, 0.52, W * 0.55 - 0.78);
  const headboard = box(THREE, 1.6, 0.8, 0.08, HEX.woodDark, 0.9, 0.54, W * 0.55 - 1.02);
  meshes.push(bed, mattress, pillow, pillow2, headboard);

  // Armoire
  const armoire = box(THREE, 0.55, 1.8, 1.2, HEX.woodDark, L - 0.4, 0.9, W * 0.3);
  meshes.push(armoire);

  // Table de chevet
  const chevet = box(THREE, 0.4, 0.5, 0.35, HEX.wood, 0.22, 0.25, W * 0.55 - 0.75);
  meshes.push(chevet);

  addToScene(scene, ...meshes);
  return meshes;
}

// ─── Sanitaires ──────────────────────────────────────────────────────────────
export function addSanitairesFurniture(scene, THREE, L, W, H) {
  const meshes = [];

  // Lavabo
  const lavabo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.22, 0.18, 16),
    mat(THREE, HEX.white, 0.2, 0.05)
  );
  lavabo.position.set(0.4, 0.83, 0.35);
  lavabo.castShadow = true;

  const vasque = box(THREE, 0.5, 0.6, 0.35, HEX.white, 0.4, 0.38, 0.3);
  const mirror = box(THREE, 0.5, 0.6, 0.03, 0x607D8B, 0.4, H * 0.6, 0.04);
  mirror.material = new THREE.MeshStandardMaterial({ color: 0x607D8B, metalness: 0.9, roughness: 0.05 });

  // WC
  const wc = box(THREE, 0.38, 0.38, 0.5, HEX.white, 0.4, 0.19, W - 0.4);
  const wcLid = box(THREE, 0.36, 0.06, 0.46, HEX.white, 0.4, 0.4, W - 0.4);

  meshes.push(lavabo, vasque, mirror, wc, wcLid);
  addToScene(scene, ...meshes);
  return meshes;
}

// ─── Cuisine ─────────────────────────────────────────────────────────────────
export function addCuisineFurniture(scene, THREE, L, W, H) {
  const meshes = [];

  // Plan de travail
  const plan = box(THREE, L * 0.65, 0.04, 0.6, HEX.grey, L * 0.35, 0.9, 0.38);
  const meuble = box(THREE, L * 0.65, 0.88, 0.58, HEX.white, L * 0.35, 0.44, 0.36);

  // Réfrigérateur
  const frigo = box(THREE, 0.7, 1.7, 0.65, HEX.white, L - 0.45, 0.85, 0.45);

  // Table cuisine
  const table = box(THREE, 0.9, 0.04, 0.6, HEX.woodLight, L * 0.5, 0.76, W * 0.65);
  for (const [px, pz] of [[L * 0.5 - 0.38, W * 0.65 - 0.22], [L * 0.5 + 0.38, W * 0.65 - 0.22],
                           [L * 0.5 - 0.38, W * 0.65 + 0.22], [L * 0.5 + 0.38, W * 0.65 + 0.22]]) {
    meshes.push(box(THREE, 0.04, 0.74, 0.04, HEX.metal, px, 0.37, pz));
  }

  meshes.push(plan, meuble, frigo, table);
  addToScene(scene, ...meshes);
  return meshes;
}

/** Dispatch selon le type de pièce */
export function addFurnitureForRoom(scene, THREE, roomType, L, W, H) {
  switch (roomType) {
    case 'Bureau':
    case 'Salle de réunion':      return addBureauFurniture(scene, THREE, L, W, H);
    case 'Salon':                  return addSalonFurniture(scene, THREE, L, W, H);
    case 'Salle de classe':        return addClasseFurniture(scene, THREE, L, W, H);
    case 'Commerce':               return addCommerceFurniture(scene, THREE, L, W, H);
    case 'Chambre':                return addChambreFurniture(scene, THREE, L, W, H);
    case 'Sanitaires':             return addSanitairesFurniture(scene, THREE, L, W, H);
    case 'Cuisine':                return addCuisineFurniture(scene, THREE, L, W, H);
    default:                       return addBureauFurniture(scene, THREE, L, W, H);
  }
}

/** Ajoute une porte (frame + panneau battant entrebâillé) */
export function addDoor(scene, THREE, doorType, L, W, H) {
  const meshes = [];
  const dW = 0.9, dH = 2.1;
  const x = L * 0.12;
  const frameColor = doorType?.includes('bois') || !doorType ? HEX.woodDark
    : doorType?.includes('vitrée') ? HEX.grey
    : doorType?.includes('métal') || doorType?.includes('aluminium') ? HEX.metal
    : HEX.woodDark;

  // Encadrement
  meshes.push(box(THREE, dW + 0.1, dH + 0.08, 0.12, frameColor, x, dH / 2, 0.02)); // frame
  // Panneau (entrebâillé à ~30°)
  const panel = box(THREE, dW, dH - 0.06, 0.05, frameColor, x, dH / 2, 0.06);
  panel.rotation.y = -0.4;
  // Vitre sur porte vitrée
  if (doorType?.includes('vitrée') || doorType?.includes('mi-vitrée')) {
    const glass = box(THREE, dW * 0.55, dH * 0.45, 0.02, 0x88CCFF, x, dH * 0.62, 0.07);
    glass.material = new THREE.MeshStandardMaterial({ color: 0x88CCFF, transparent: true, opacity: 0.35, metalness: 0.1 });
    glass.rotation.y = -0.4;
    meshes.push(glass);
  }
  // Poignée
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), mat(THREE, HEX.metal, 0.2, 0.8));
  handle.rotation.z = Math.PI / 2;
  handle.position.set(x + dW * 0.38, dH * 0.5, 0.1);
  handle.rotation.y = -0.4;
  meshes.push(panel, handle);
  addToScene(scene, ...meshes);
  return meshes;
}

/** Ajoute une fenêtre avec son cadre et vitrage */
export function addWindow(scene, THREE, windowType, windowArea, ceilingH, wallSide, wallCenter, wallOther) {
  const meshes = [];
  const wW = Math.min(Math.sqrt(windowArea) * 1.2, 1.8);
  const wH = Math.min(Math.sqrt(windowArea) * 0.9, 1.4);
  const frameColor = windowType?.includes('aluminium') ? HEX.metal : HEX.woodDark;
  const y = ceilingH * 0.55;

  let pos, ry;
  if (wallSide === 'back')  { pos = [wallCenter, y, 0.04]; ry = 0; }
  else if (wallSide === 'left')  { pos = [0.04, y, wallOther]; ry = Math.PI / 2; }
  else if (wallSide === 'right') { pos = [wallCenter - 0.04, y, wallOther]; ry = Math.PI / 2; }
  else { pos = [wallCenter, y, wallOther - 0.04]; ry = 0; }

  // Frame extérieur
  const frame = box(THREE, wW + 0.12, wH + 0.12, 0.08, frameColor, ...pos, 0, ry);
  // Vitrage
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(wW, wH),
    new THREE.MeshStandardMaterial({ color: 0xAAD8F0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, metalness: 0.1 }));
  glass.position.set(...pos);
  glass.rotation.y = ry;

  // Jalousie / persienne (lamelles)
  if (windowType?.includes('Jalousie')) {
    for (let i = 0; i < 6; i++) {
      const lam = box(THREE, wW, 0.03, 0.06, 0xBCAAA4, pos[0], pos[1] - wH / 2 + i * (wH / 6) + 0.04, pos[2] + 0.06, 0, ry);
      meshes.push(lam);
    }
  }

  // Traverse centrale
  const crossH = box(THREE, wW + 0.06, 0.04, 0.06, frameColor, pos[0], pos[1], pos[2] + 0.01, 0, ry);
  const crossV = box(THREE, 0.04, wH + 0.06, 0.06, frameColor, pos[0], pos[1], pos[2] + 0.01, 0, ry);

  meshes.push(frame, glass, crossH, crossV);
  addToScene(scene, ...meshes);
  return meshes;
}
