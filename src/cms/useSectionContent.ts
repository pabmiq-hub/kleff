import { useRouterState } from "@tanstack/react-router";
import { getSectionSchema, withDefaults } from "./schemas";

/**
 * Returns the editable content for a given section, merged on top of its
 * schema defaults. The page route loader is expected to expose
 * `pageContent: { sections: { [key]: {...} } }` in its loader data — see
 * `loadPageContent()` below.
 *
 * If the loader hasn't loaded the data yet (or the route doesn't load it),
 * returns the schema defaults so the page never renders empty.
 */
export function useSectionContent<T extends Record<string, unknown> = Record<string, unknown>>(
  sectionKey: string
): T {
  const stored = useRouterState({
    select: (s) => {
      for (const m of s.matches) {
        const ld: any = m.loaderData;
        if (ld?.pageContent?.sections && sectionKey in ld.pageContent.sections) {
          return ld.pageContent.sections[sectionKey] as Record<string, unknown>;
        }
      }
      return null;
    },
  });

  const schema = getSectionSchema(sectionKey);
  if (!schema) return (stored ?? {}) as T;
  return withDefaults(schema, stored) as T;
}
