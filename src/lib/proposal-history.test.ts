import { describe, expect, it } from "vitest";
import {
  addProposalVersion,
  compareProposalWith,
  EMPTY_PROPOSAL_HISTORY,
  getCurrentProposal,
  type NewProposal,
  type ProposalHistory,
  selectProposalVersion,
} from "./proposal-history";

const proposal = (overrides: Partial<NewProposal> = {}): NewProposal => ({
  basedOn: null,
  brief: "un paisaje andino",
  createdAt: 1,
  image: "data:image/png;base64,AAA",
  prompt: null,
  request: "un paisaje andino",
  strategy: "create",
  zoneLabel: null,
  ...overrides,
});

/** V1 inicial → V2 desde V1 → V3 desde V2. */
const threeVersions = (): ProposalHistory => {
  const v1 = addProposalVersion(EMPTY_PROPOSAL_HISTORY, proposal({ image: "img-1" }));
  const v2 = addProposalVersion(
    v1,
    proposal({ basedOn: 1, image: "img-2", request: "agrega un sol", strategy: "inpaint" }),
  );
  return addProposalVersion(
    v2,
    proposal({ basedOn: 2, image: "img-3", request: "hazlo acuarela", strategy: "redesign" }),
  );
};

describe("addProposalVersion — criterio 2: cada solicitud genera una nueva propuesta", () => {
  it("numera la propuesta inicial como V1, la deja actual y la compara con la prenda base", () => {
    const history = addProposalVersion(EMPTY_PROPOSAL_HISTORY, proposal());

    expect(history.versions).toHaveLength(1);
    expect(history.versions[0]).toMatchObject({ basedOn: null, version: 1 });
    expect(history.currentVersion).toBe(1);
    expect(history.compareVersion).toBeNull();
  });

  it("agrega la modificación como versión nueva y la compara con la versión de origen", () => {
    const v1 = addProposalVersion(EMPTY_PROPOSAL_HISTORY, proposal());
    const v2 = addProposalVersion(
      v1,
      proposal({ basedOn: 1, request: "agrega un sol", strategy: "inpaint", zoneLabel: "Pecho" }),
    );

    expect(v2.currentVersion).toBe(2);
    expect(v2.compareVersion).toBe(1);
    expect(getCurrentProposal(v2)).toMatchObject({
      request: "agrega un sol",
      strategy: "inpaint",
      version: 2,
      zoneLabel: "Pecho",
    });
  });

  it("ignora un origen que no existe en el historial", () => {
    const history = addProposalVersion(EMPTY_PROPOSAL_HISTORY, proposal({ basedOn: 7 }));

    expect(history.versions[0].basedOn).toBeNull();
    expect(history.compareVersion).toBeNull();
  });

  it("no modifica el historial recibido", () => {
    const v1 = addProposalVersion(EMPTY_PROPOSAL_HISTORY, proposal());
    addProposalVersion(v1, proposal({ basedOn: 1 }));

    expect(v1.versions).toHaveLength(1);
    expect(EMPTY_PROPOSAL_HISTORY.versions).toHaveLength(0);
  });
});

describe("historial — criterio 3: se conservan las propuestas para comparar", () => {
  it("conserva todas las versiones en orden con su imagen y su petición", () => {
    const history = threeVersions();

    expect(history.versions.map((item) => [item.version, item.image, item.request])).toEqual([
      [1, "img-1", "un paisaje andino"],
      [2, "img-2", "agrega un sol"],
      [3, "img-3", "hazlo acuarela"],
    ]);
  });

  it("vuelve a una versión anterior sin perder las posteriores", () => {
    const history = selectProposalVersion(threeVersions(), 1);

    expect(history.currentVersion).toBe(1);
    expect(history.versions).toHaveLength(3);
  });

  it("una modificación pedida desde una versión anterior se agrega al final", () => {
    const fromV1 = selectProposalVersion(threeVersions(), 1);
    const history = addProposalVersion(
      fromV1,
      proposal({ basedOn: 1, image: "img-4", request: "fondo azul" }),
    );

    expect(history.versions.map((item) => item.version)).toEqual([1, 2, 3, 4]);
    expect(getCurrentProposal(history)).toMatchObject({ basedOn: 1, version: 4 });
    expect(history.compareVersion).toBe(1);
  });

  it("permite comparar con cualquier otra versión o con la prenda base", () => {
    const history = threeVersions();

    expect(compareProposalWith(history, 1).compareVersion).toBe(1);
    expect(compareProposalWith(history, null).compareVersion).toBeNull();
  });

  it("no compara una versión consigo misma ni con una versión inexistente", () => {
    const history = threeVersions();

    expect(compareProposalWith(history, 3)).toBe(history);
    expect(compareProposalWith(history, 9)).toBe(history);
  });

  it("al mostrar la versión que estaba a la izquierda, compara con su origen", () => {
    const history = compareProposalWith(threeVersions(), 1);
    const selected = selectProposalVersion(history, 1);

    expect(selected.currentVersion).toBe(1);
    expect(selected.compareVersion).toBeNull();
  });

  it("ignora la selección de una versión inexistente", () => {
    const history = threeVersions();

    expect(selectProposalVersion(history, 9)).toBe(history);
  });
});
