"use client";

import { useMemo, useState } from "react";

type VariantOption = { option: string; type: string };
type Variant = {
  id: number;
  options: VariantOption[];
  price: string | null;
};

type VariantSelectorProps = {
  basePrice: string | null;
  optionTypes: string[];
  variants: Variant[];
};

/**
 * Lets the customer pick one option per variant type (size, color) and shows
 * the information of the matching variant (HU-07).
 */
export const VariantSelector = ({ basePrice, optionTypes, variants }: VariantSelectorProps) => {
  const [selected, setSelected] = useState<Record<string, string>>({});

  const optionsByType = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const type of optionTypes) {
      const values = new Set<string>();
      for (const variant of variants) {
        for (const option of variant.options) {
          if (option.type === type) {
            values.add(option.option);
          }
        }
      }
      map.set(type, [...values]);
    }
    return map;
  }, [optionTypes, variants]);

  const selectionComplete = optionTypes.length > 0 && optionTypes.every((type) => selected[type]);

  const matchingVariant = selectionComplete
    ? variants.find((variant) =>
        optionTypes.every((type) =>
          variant.options.some(
            (option) => option.type === type && option.option === selected[type],
          ),
        ),
      )
    : undefined;

  const price = matchingVariant?.price ?? basePrice;

  return (
    <>
      {optionTypes.map((type) => (
        <fieldset key={type} className="detail-fieldset">
          <legend className="detail-label">{type}</legend>
          <ul className="option-chips">
            {(optionsByType.get(type) ?? []).map((value) => {
              const active = selected[type] === value;
              return (
                <li key={value}>
                  <button
                    type="button"
                    className="option-chip"
                    aria-pressed={active}
                    onClick={() => setSelected((prev) => ({ ...prev, [type]: value }))}
                  >
                    {value}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      {price ? <span className="detail-price">{price}</span> : null}

      <p className="variant-summary" role="status">
        {selectionComplete ? (
          matchingVariant ? (
            <>
              Opción elegida:{" "}
              <strong>{optionTypes.map((type) => `${type} ${selected[type]}`).join(" · ")}</strong>
            </>
          ) : (
            "Esta combinación no está disponible."
          )
        ) : null}
      </p>
    </>
  );
};
