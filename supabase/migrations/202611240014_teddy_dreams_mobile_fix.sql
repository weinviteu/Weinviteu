-- Teddy Dreams on iPhone: text cards showed only half, and the opening envelope was blank before tapping.
-- Applies the template fix to orders that already saved their own copy of the design.
-- After running this, open each Teddy Dreams order in the Customizer and save once so its link is regenerated.
-- Safe to run more than once.
UPDATE public.orders
SET source_html = replace(replace(replace(replace(source_html,
  E'  transform-style: preserve-3d;\n  will-change: opacity, transform;',
  E'  transform-style: flat;\n  will-change: opacity, transform;'),
  'v1Wrap.style.transform = `scale(', 'v1Wrap.style.transform = `perspective(1200px) scale('),
  'v2Wrap.style.transform = `scale(', 'v2Wrap.style.transform = `perspective(1200px) scale('),
  E'src="/template-assets/premium/teddy-dreams-opening.mp4"\n            muted',
  E'src="/template-assets/premium/teddy-dreams-opening.mp4"\n            poster="/template-assets/premium/teddy-dreams-opening-poster.jpg"\n            muted')
WHERE template_filename = 'baby-shower-teddy-dreams.html'
  AND source_html IS NOT NULL;
