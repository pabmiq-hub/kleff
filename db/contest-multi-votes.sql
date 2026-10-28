-- Allow several votes per category (one per participant) for each voter.
ALTER TABLE public.contest_votes DROP CONSTRAINT IF EXISTS contest_votes_pkey;
ALTER TABLE public.contest_votes ADD PRIMARY KEY (voter_id, category_id, entry_id);
