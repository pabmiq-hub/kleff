// Properties supported by the visual editor
export type EditableKind = "text" | "image";

export type StyleProps = {
  color?: string;
  backgroundColor?: string;
  fontSize?: string; // e.g. "32px"
  fontWeight?: string; // "400" | "600" | "700"
  textAlign?: "left" | "center" | "right";
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
};

export type OverrideMap = {
  // element_id -> { property -> value }
  [elementId: string]: {
    text?: string;
    src?: string;
    alt?: string;
    style?: StyleProps;
    hidden?: boolean;
  };
};

export type OverrideRecord = {
  element_id: string;
  property: string;
  value: unknown;
};

export type OverrideStatus = "draft" | "published";

export function buildOverrideMap(
  rows: Array<{ element_id: string; property: string; value: unknown }>
): OverrideMap {
  const map: OverrideMap = {};
  for (const r of rows) {
    if (!map[r.element_id]) map[r.element_id] = {};
    const target = map[r.element_id] as Record<string, unknown>;
    if (r.property === "style") {
      target.style = { ...(target.style as object), ...(r.value as object) };
    } else {
      target[r.property] = r.value;
    }
  }
  return map;
}

// Merge draft overrides on top of published ones
export function mergeOverrides(
  published: Array<{ element_id: string; property: string; value: unknown }>,
  drafts: Array<{ element_id: string; property: string; value: unknown }>
): OverrideMap {
  return buildOverrideMap([...published, ...drafts]);
}
