alter table public.agent_service_areas
  add column if not exists conversion_score numeric(5,2) not null default 50
  check (conversion_score between 0 and 100);

insert into public.agent_service_areas (agent_id, zone, is_primary, availability_score, conversion_score)
select profile.id, 'toate', true, 100, 50
from public.profiles profile
where profile.role = 'AGENT' and coalesce(profile.is_active, true)
on conflict (agent_id, zone) do nothing;

create or replace function private.pick_agent_for_lead(p_lead_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select lead.id,
           lower(coalesce(lead.zone_interest, property.zone, property.city, '')) as desired_zone
    from public.leads lead
    left join public.properties property on property.id = lead.property_id
    where lead.id = p_lead_id
  ), candidates as (
    select profile.id,
           area.availability_score,
           area.conversion_score,
           area.is_primary,
           area.max_active_leads,
           count(active_lead.id) filter (
             where active_lead.status not in ('WON', 'CLOSED', 'LOST')
           ) as active_count,
           case when lower(area.zone) = target.desired_zone then 0 else 1 end as zone_rank
    from target
    join public.agent_service_areas area
      on area.active
     and (target.desired_zone = '' or lower(area.zone) = target.desired_zone or lower(area.zone) = 'toate')
    join public.profiles profile
      on profile.id = area.agent_id
     and profile.role = 'AGENT'
     and coalesce(profile.is_active, true)
    left join public.leads active_lead on active_lead.agent_id = profile.id
    group by profile.id, area.availability_score, area.conversion_score, area.is_primary,
             area.max_active_leads, target.desired_zone, area.zone
  )
  select candidate.id
  from candidates candidate
  where candidate.active_count < candidate.max_active_leads
  order by candidate.zone_rank,
           candidate.is_primary desc,
           candidate.availability_score desc,
           candidate.conversion_score desc,
           (candidate.active_count::numeric / candidate.max_active_leads) asc,
           candidate.id
  limit 1;
$$;
