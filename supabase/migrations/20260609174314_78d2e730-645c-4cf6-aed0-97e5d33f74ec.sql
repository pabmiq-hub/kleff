UPDATE public.content_sections
SET content = jsonb_set(
  content,
  '{items}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN item ? 'photo' AND item->>'photo' LIKE '%kleff.es/wp-content%'
          THEN jsonb_set(item, '{photo}', '""'::jsonb)
        ELSE item
      END
    )
    FROM jsonb_array_elements(content->'items') AS item
  )
)
WHERE section_key = 'about.team'
  AND content ? 'items';