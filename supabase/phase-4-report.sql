-- Inner Compass — Phase 4 report-text columns
-- Run this in the Supabase SQL editor for project bvctshqpfnedauytyzfo
-- BEFORE deploying the Phase 4 code.
--
-- Adds two columns to scoring_results so the generated report can be cached
-- per-session — avoids paying the Anthropic API cost on every dashboard
-- reload, and gives the user immediate read access after the first generation.

alter table public.scoring_results
  add column if not exists report_text text;

alter table public.scoring_results
  add column if not exists report_generated_at timestamptz;
