import { describe, expect, it } from "vitest";
import { extractDesignText } from "./design-text";

describe("extractDesignText", () => {
  it("extrae la palabra después de 'palabra'", () => {
    expect(extractDesignText("Quita eso y agrega la palabra I LOVE YOU")).toBe("I LOVE YOU");
  });

  it("extrae texto entre comillas", () => {
    expect(extractDesignText("agrega el texto 'HOLA MUNDO' en el pecho")).toBe("HOLA MUNDO");
  });

  it("extrae texto después de 'que diga'", () => {
    expect(extractDesignText("pon un letrero que diga BIENVENIDO")).toBe("BIENVENIDO");
  });

  it("detecta una frase en mayúsculas sin palabra clave", () => {
    expect(extractDesignText("agrega I LOVE YOU al diseño")).toBe("I LOVE YOU");
  });

  it("no confunde cambios de color con texto", () => {
    expect(extractDesignText("cambia el color a AZUL")).toBeNull();
    expect(extractDesignText('cambia el color a "azul"')).toBeNull();
  });

  it("no confunde instrucciones de tipografía con texto", () => {
    expect(extractDesignText("cambia la tipografía a algo más grande")).toBeNull();
    expect(extractDesignText("haz el texto más grande")).toBeNull();
    expect(extractDesignText("el texto actual es muy grande")).toBeNull();
  });

  it("no detecta texto en cambios de estilo", () => {
    expect(extractDesignText("haz que los árboles se vean realistas")).toBeNull();
  });

  it("no imprime instrucciones de borrado", () => {
    expect(extractDesignText("quita la palabra HOLA")).toBeNull();
  });

  it("corta la ubicación del texto pedido", () => {
    expect(extractDesignText("agrega la palabra HOLA en el pecho")).toBe("HOLA");
  });

  it("no imprime color ni tamaño como texto", () => {
    expect(extractDesignText("agrega el texto en negro")).toBeNull();
    expect(extractDesignText("agrega letras grandes")).toBeNull();
  });

  it("no confunde un borde en mayúsculas con texto", () => {
    expect(extractDesignText("agrega un borde NEGRO Y BLANCO")).toBeNull();
  });

  it("conserva apóstrofos y signos dentro de comillas", () => {
    expect(extractDesignText('agrega el texto "I\'M HERE"')).toBe("I'M HERE");
    expect(extractDesignText("agrega la palabra HELLO!")).toBe("HELLO!");
  });

  it("detecta 'escribe' con texto en minúsculas", () => {
    expect(extractDesignText("escribe hola")).toBe("hola");
  });

  it("acepta una frase en mayúsculas como único contenido", () => {
    expect(extractDesignText("I LOVE YOU")).toBe("I LOVE YOU");
  });

  it("quita el verbo de intención de una frase en mayúsculas", () => {
    expect(extractDesignText("AGREGA I LOVE YOU al diseño")).toBe("I LOVE YOU");
  });
});
