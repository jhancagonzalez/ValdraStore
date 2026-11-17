import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { composeDesignAddition } from "./addition";

const svg = (body: string) =>
  sharp(Buffer.from(`<svg width="100" height="100">${body}</svg>`))
    .png()
    .toBuffer();
const original = () =>
  svg(
    '<rect width="100" height="100" fill="#20252a"/><circle cx="50" cy="25" r="15" fill="white"/>',
  );
const selection = { x: 0.2, y: 0.55, width: 0.6, height: 0.35 };
const rgb = async (image: Buffer) =>
  sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });

describe("HU-16 — adición sin reconstruir el original", () => {
  it("conserva exactamente el balón y todos los píxeles exteriores", async () => {
    const base = await original();
    const field = await svg(
      '<rect width="100" height="100" fill="white"/><rect x="10" y="20" width="80" height="60" fill="green"/><path d="M50 20V80" stroke="white" stroke-width="4"/>',
    );
    const result = await composeDesignAddition(base, field, selection);
    expect(result).not.toBeNull();
    const before = await rgb(base);
    const after = await rgb(result as Buffer);
    expect(after.info.width).toBe(100);
    expect(after.info.height).toBe(100);
    let interiorChanges = 0;
    for (let y = 0; y < 100; y += 1) {
      for (let x = 0; x < 100; x += 1) {
        const offset = (y * 100 + x) * 3;
        const changed = !before.data
          .subarray(offset, offset + 3)
          .equals(after.data.subarray(offset, offset + 3));
        if (x < 20 || x >= 80 || y < 55 || y >= 90) expect(changed).toBe(false);
        else if (changed) interiorChanges += 1;
      }
    }
    expect(interiorChanges).toBeGreaterThan(0);
    // La línea blanca conecta con el exterior: debe seguir blanca sobre la cancha.
    // El escalado puede dejar la línea entre dos píxeles: revisar su vecindad.
    const whiteLine = [47, 48, 49, 50, 51, 52].some((x) => {
      const offset = (72 * 100 + x) * 3;
      return [0, 1, 2].every((channel) => after.data[offset + channel] > 230);
    });
    expect(whiteLine).toBe(true);
  });

  it("conserva blancos encerrados por el contorno de un elemento irregular", async () => {
    const panda = await svg(
      '<rect width="100" height="100" fill="white"/><circle cx="50" cy="50" r="30" fill="black"/><circle cx="50" cy="50" r="20" fill="white"/>',
    );
    const result = await composeDesignAddition(await original(), panda, selection);
    expect(result).not.toBeNull();
    const after = await rgb(result as Buffer);
    const center = (72 * 100 + 50) * 3;
    expect(after.data[center]).toBeGreaterThan(230);
  });

  it("acepta alfa real sin borrar la tinta blanca del dibujo", async () => {
    const element = await svg('<circle cx="50" cy="50" r="30" fill="white"/>');
    const result = await composeDesignAddition(await original(), element, selection);
    expect(result).not.toBeNull();
    const after = await rgb(result as Buffer);
    expect(after.data[(72 * 100 + 50) * 3]).toBeGreaterThan(230);
  });

  it("no convierte elementos separados en un parche blanco rectangular", async () => {
    const scattered = await svg(
      '<rect width="100" height="100" fill="white"/><rect x="10" y="10" width="20" height="20" fill="green"/><rect x="70" y="10" width="20" height="20" fill="green"/><rect x="10" y="70" width="20" height="20" fill="green"/><rect x="70" y="70" width="20" height="20" fill="green"/>',
    );
    const base = await original();
    const result = await composeDesignAddition(base, scattered, selection);
    expect(result).not.toBeNull();
    const before = await rgb(base);
    const after = await rgb(result as Buffer);
    const center = (72 * 100 + 50) * 3;
    expect(after.data.subarray(center, center + 3)).toEqual(
      before.data.subarray(center, center + 3),
    );
  });

  it("rechaza el fondo complejo y una salida completamente vacía", async () => {
    const base = await original();
    const complex = await svg('<rect width="100" height="100" fill="blue"/>');
    const empty = await svg('<rect width="100" height="100" fill="white"/>');
    expect(await composeDesignAddition(base, complex, selection)).toBeNull();
    expect(await composeDesignAddition(base, empty, selection)).toBeNull();
  });

  it("rechaza una selección inválida antes de componer", async () => {
    expect(
      await composeDesignAddition(await original(), await original(), { ...selection, width: 0 }),
    ).toBeNull();
  });
});
