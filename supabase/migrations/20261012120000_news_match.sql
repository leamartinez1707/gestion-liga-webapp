-- A news article can be about a match: the public page shows its result
alter table public.news_articles
  add column if not exists match_id uuid references public.matches(id) on delete set null;

create index if not exists news_articles_match_id_idx on public.news_articles (match_id);
