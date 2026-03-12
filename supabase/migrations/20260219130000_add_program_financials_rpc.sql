create or replace function get_program_financials(p_program_id uuid)
returns table (
  total_budget numeric,
  spent_budget numeric,
  variance numeric,
  forecast numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select
    coalesce(sum(budget), 0) as total_budget,
    coalesce(sum(spent), 0) as spent_budget,
    coalesce(sum(budget) - sum(spent), 0) as variance,
    coalesce(sum(budget), 0) as forecast -- Placeholder forecast logic
  from projects
  where program_id = p_program_id;
end;
$$;
