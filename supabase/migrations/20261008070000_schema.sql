-- Micro-batch pre-orders: tables live in the private `app` schema (not exposed by the Data API).
-- The browser only calls the `public` functions below. Identity comes from the Clerk session
-- token (`auth.jwt()->>'sub'`); anonymous buyers prove order ownership with their tracking token.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;
revoke all on schema app from public, anon, authenticated;

-- ---------------------------------------------------------------- tables

create table app.creators (
  id            text primary key,                       -- Clerk user id
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  display_name  text not null check (length(display_name) between 2 and 80),
  studio_name   text not null check (length(studio_name) between 2 and 80),
  city          text not null default '',
  bio           text not null default '' check (length(bio) <= 280),
  accent_hue    int  not null default 18 check (accent_hue between 0 and 360),
  emoji         text not null default '🏺',
  created_at    timestamptz not null default now()
);

create table app.batches (
  id                text primary key,
  code              text not null,
  creator_id        text not null references app.creators (id) on delete cascade,
  title             text not null check (length(title) between 3 and 120),
  tagline           text not null default '',
  description       text not null default '',
  unit_label        text not null default 'pieces',
  price             int  not null check (price > 0),
  funding_goal      int  not null check (funding_goal > 0),
  max_quantity      int  not null,
  funding_deadline  timestamptz not null,
  cover_hue         int  not null default 22,
  stage             text not null default 'funding'
                    check (stage in ('funding', 'mold', 'kiln', 'glazing', 'fulfillment', 'complete', 'cancelled')),
  stage_history     jsonb not null default '[]',
  created_at        timestamptz not null default now(),
  check (max_quantity >= funding_goal)
);
create index batches_creator_idx on app.batches (creator_id);

create table app.orders (
  id              text primary key,
  number          text not null,
  batch_id        text not null references app.batches (id) on delete cascade,
  buyer_name      text not null,
  email           text not null,
  quantity        int  not null check (quantity between 1 and 10),
  address         text not null,
  city            text not null,
  pincode         text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  status          text not null default 'pledged'
                  check (status in ('pledged', 'charged', 'packaged', 'shipped', 'refunded')),
  tracking_token  text not null unique,
  tier            int,
  packaged_at     timestamptz,
  courier         text,
  awb             text,
  shipped_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index orders_batch_idx on app.orders (batch_id);
create index orders_email_idx on app.orders (lower(email));

create table app.comments (
  id          text primary key,
  batch_id    text not null references app.batches (id) on delete cascade,
  update_key  text not null,
  parent_id   text references app.comments (id) on delete cascade,
  author      jsonb not null,
  body        text not null check (length(body) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index comments_batch_idx on app.comments (batch_id);

-- Emails waiting to be delivered (an Edge Function + Resend will drain this later).
create table app.outbox (
  id          text primary key,
  batch_id    text not null references app.batches (id) on delete cascade,
  kind        text not null,
  stage       text,
  subject     text not null,
  body        text not null,
  photo_url   text,
  recipients  text[] not null,
  sent_at     timestamptz not null default now(),
  delivered_at timestamptz
);
create index outbox_batch_idx on app.outbox (batch_id);

-- ---------------------------------------------------------------- helpers

create function app.iso(ts timestamptz) returns text
language sql immutable set search_path = '' as $$
  select to_char(ts at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;

create function app.current_user_id() returns text
language sql stable set search_path = '' as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create function app.require_user() returns text
language plpgsql stable set search_path = '' as $$
declare v text := app.current_user_id();
begin
  if v is null then raise exception 'Please sign in first.'; end if;
  return v;
end $$;

create function app.require_creator() returns text
language plpgsql stable set search_path = '' as $$
declare v text := app.require_user();
begin
  if not exists (select 1 from app.creators where id = v) then
    raise exception 'Set up your studio first.';
  end if;
  return v;
end $$;

create function app.new_id(prefix text) returns text
language sql volatile set search_path = '' as $$
  select prefix || encode(extensions.gen_random_bytes(5), 'hex')
$$;

create function app.new_token() returns text
language sql volatile set search_path = '' as $$
  select 'trk_' || translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_')
$$;

create function app.active_units(p_batch_id text) returns int
language sql stable set search_path = '' as $$
  select coalesce(sum(quantity), 0)::int from app.orders where batch_id = p_batch_id and status <> 'refunded'
$$;

/** The caller's own batch, locked for update. Same error for other creators' batches. */
create function app.own_batch(p_id text) returns app.batches
language plpgsql set search_path = '' as $$
declare b app.batches;
begin
  select * into b from app.batches where id = p_id and creator_id = app.require_user() for update;
  if not found then raise exception 'Batch not found'; end if;
  return b;
end $$;

create function app.queue_email(
  p_batch_id text, p_kind text, p_subject text, p_body text, p_recipients text[],
  p_stage text default null, p_photo_url text default null
) returns int
language plpgsql set search_path = '' as $$
begin
  if p_recipients is null or cardinality(p_recipients) = 0 then return 0; end if;
  insert into app.outbox (id, batch_id, kind, stage, subject, body, photo_url, recipients)
  values (app.new_id('mail-'), p_batch_id, p_kind, p_stage, p_subject, p_body, p_photo_url, p_recipients);
  return cardinality(p_recipients);
end $$;

-- ---------------------------------------------------------------- JSON shapes (camelCase for the app)

create function app.creator_json(c app.creators) returns jsonb
language sql stable set search_path = '' as $$
  select case when c.id is null then null else jsonb_build_object(
    'id', c.id, 'slug', c.slug, 'displayName', c.display_name, 'studioName', c.studio_name,
    'city', c.city, 'bio', c.bio, 'accentHue', c.accent_hue, 'emoji', c.emoji,
    'createdAt', app.iso(c.created_at)
  ) end
$$;

/** Public batch view: buyer details are reduced to quantity + status for progress stats. */
create function app.batch_json(b app.batches) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', b.id, 'code', b.code, 'creatorId', b.creator_id, 'title', b.title, 'tagline', b.tagline,
    'description', b.description, 'unitLabel', b.unit_label, 'price', b.price,
    'fundingGoal', b.funding_goal, 'maxQuantity', b.max_quantity,
    'fundingDeadline', app.iso(b.funding_deadline), 'coverHue', b.cover_hue, 'stage', b.stage,
    'stageHistory', b.stage_history, 'createdAt', app.iso(b.created_at),
    'creator', (select app.creator_json(c) from app.creators c where c.id = b.creator_id),
    'orderSummary', coalesce(
      (select jsonb_agg(jsonb_build_object('quantity', o.quantity, 'status', o.status))
       from app.orders o where o.batch_id = b.id),
      '[]'::jsonb)
  )
$$;

create function app.order_json(o app.orders) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'batchId', o.batch_id, 'buyerName', o.buyer_name,
    'email', o.email, 'quantity', o.quantity, 'address', o.address, 'city', o.city,
    'pincode', o.pincode, 'status', o.status, 'trackingToken', o.tracking_token, 'tier', o.tier,
    'packagedAt', app.iso(o.packaged_at), 'courier', o.courier, 'awb', o.awb,
    'shippedAt', app.iso(o.shipped_at), 'createdAt', app.iso(o.created_at)
  )
$$;

create function app.comment_json(c app.comments) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'batchId', c.batch_id, 'updateKey', c.update_key, 'parentId', c.parent_id,
    'author', c.author, 'body', c.body, 'createdAt', app.iso(c.created_at)
  )
$$;

-- ---------------------------------------------------------------- public reads

create function public.list_public_batches() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(app.batch_json(b) order by b.created_at desc), '[]'::jsonb) from app.batches b
$$;

create function public.get_public_batch(p_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare b app.batches;
begin
  select * into b from app.batches where id = p_id;
  if not found then raise exception 'Batch not found'; end if;
  return app.batch_json(b);
end $$;

create function public.get_tracking(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare o app.orders;
begin
  select * into o from app.orders where tracking_token = trim(p_token);
  if not found then raise exception 'We couldn''t find an order with that tracking code.'; end if;
  return jsonb_build_object(
    'order', app.order_json(o),
    'batch', (select app.batch_json(b) from app.batches b where b.id = o.batch_id)
  );
end $$;

/** Orders placed with the signed-in user's email (the `email` claim in the Clerk session token). */
create function public.my_orders() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(
           jsonb_build_object('order', app.order_json(o), 'batch', app.batch_json(b))
           order by o.created_at desc), '[]'::jsonb)
  from app.orders o
  join app.batches b on b.id = o.batch_id
  where app.current_user_id() is not null
    and nullif(auth.jwt() ->> 'email', '') is not null
    and lower(o.email) = lower(auth.jwt() ->> 'email')
$$;

create function public.get_studio(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c app.creators;
begin
  select * into c from app.creators where slug = p_slug;
  if not found then raise exception 'Studio not found'; end if;
  return jsonb_build_object(
    'creator', app.creator_json(c),
    'batches', coalesce(
      (select jsonb_agg(app.batch_json(b) order by b.created_at desc)
       from app.batches b where b.creator_id = c.id and b.stage <> 'cancelled'),
      '[]'::jsonb)
  );
end $$;

create function public.list_studios() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(app.creator_json(c) || jsonb_build_object('batchCount', n.cnt) order by c.created_at), '[]'::jsonb)
  from app.creators c
  join lateral (
    select count(*)::int as cnt from app.batches b where b.creator_id = c.id and b.stage <> 'cancelled'
  ) n on n.cnt > 0
$$;

create function public.list_comments(p_batch_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(app.comment_json(c) order by c.created_at), '[]'::jsonb)
  from app.comments c where c.batch_id = p_batch_id
$$;

-- ---------------------------------------------------------------- creator reads

create function public.get_my_creator() returns jsonb
language sql stable security definer set search_path = '' as $$
  select (select app.creator_json(c) from app.creators c where c.id = app.current_user_id())
$$;

create function public.list_creator_batches() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(app.batch_json(b) order by b.created_at desc), '[]'::jsonb)
  from app.batches b where b.creator_id = app.require_user()
$$;

create function public.get_batch_admin(p_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare b app.batches;
begin
  select * into b from app.batches where id = p_id and creator_id = app.require_user();
  if not found then raise exception 'Batch not found'; end if;
  return jsonb_build_object(
    'batch', app.batch_json(b),
    'orders', coalesce(
      (select jsonb_agg(app.order_json(o) order by o.created_at desc) from app.orders o where o.batch_id = b.id),
      '[]'::jsonb)
  );
end $$;

create function public.list_outbox() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', m.id, 'batchId', m.batch_id, 'batchTitle', b.title, 'kind', m.kind, 'stage', m.stage,
           'subject', m.subject, 'body', m.body, 'photoUrl', m.photo_url,
           'recipients', to_jsonb(m.recipients), 'sentAt', app.iso(m.sent_at)
         ) order by m.sent_at desc), '[]'::jsonb)
  from app.outbox m
  join app.batches b on b.id = m.batch_id
  where b.creator_id = app.require_user()
$$;

-- ---------------------------------------------------------------- creator writes

create function public.save_creator_profile(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid text := app.require_user();
  c app.creators;
begin
  if exists (select 1 from app.creators where slug = p ->> 'slug' and id <> v_uid) then
    raise exception 'That studio URL is taken — try another.';
  end if;
  insert into app.creators (id, slug, display_name, studio_name, city, bio, accent_hue, emoji)
  values (
    v_uid, p ->> 'slug', trim(p ->> 'displayName'), trim(p ->> 'studioName'),
    trim(coalesce(p ->> 'city', '')), trim(coalesce(p ->> 'bio', '')),
    coalesce((p ->> 'accentHue')::int, 18), coalesce(nullif(p ->> 'emoji', ''), '🏺')
  )
  on conflict (id) do update set
    slug = excluded.slug, display_name = excluded.display_name, studio_name = excluded.studio_name,
    city = excluded.city, bio = excluded.bio, accent_hue = excluded.accent_hue, emoji = excluded.emoji
  returning * into c;
  return app.creator_json(c);
exception
  when unique_violation then raise exception 'That studio URL is taken — try another.';
  when check_violation or not_null_violation then raise exception 'Please check your studio details.';
end $$;

create function public.create_batch(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid text := app.require_creator();
  v_id text;
  v_now text := app.iso(now());
  b app.batches;
begin
  v_id := left(trim(both '-' from regexp_replace(lower(coalesce(p ->> 'title', '')), '[^a-z0-9]+', '-', 'g')), 40);
  if v_id = '' then v_id := app.new_id('batch-'); end if;
  if exists (select 1 from app.batches where id = v_id) then
    v_id := v_id || '-' || encode(extensions.gen_random_bytes(2), 'hex');
  end if;
  if (p ->> 'fundingDeadline')::timestamptz <= now() then
    raise exception 'Pick a funding deadline in the future.';
  end if;

  insert into app.batches (
    id, code, creator_id, title, tagline, description, unit_label, price, funding_goal,
    max_quantity, funding_deadline, cover_hue, stage, stage_history
  ) values (
    v_id, coalesce(nullif(p ->> 'code', ''), 'MB'), v_uid, trim(p ->> 'title'),
    trim(coalesce(p ->> 'tagline', '')), trim(coalesce(p ->> 'description', '')),
    coalesce(nullif(trim(p ->> 'unitLabel'), ''), 'pieces'),
    (p ->> 'price')::int, (p ->> 'fundingGoal')::int, (p ->> 'maxQuantity')::int,
    (p ->> 'fundingDeadline')::timestamptz, coalesce((p ->> 'coverHue')::int, 22), 'funding',
    jsonb_build_array(jsonb_build_object('stage', 'funding', 'at', v_now, 'note', 'Pre-orders are open!'))
  ) returning * into b;
  return app.batch_json(b);
exception
  when check_violation or not_null_violation or invalid_text_representation or invalid_datetime_format then
    raise exception 'Please check the batch details.';
end $$;

/**
 * Moves a batch to its next stage. `p_expected` guards against double-clicks and stale tabs.
 * Leaving funding "charges" every pledge (real card charges will hook in here).
 */
create function public.advance_stage(
  p_batch_id text, p_expected text, p_note text, p_message text, p_subject text, p_photo_url text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b app.batches;
  v_order text[] := array['funding', 'mold', 'kiln', 'glazing', 'fulfillment', 'complete'];
  v_idx int;
  v_next text;
  v_units int;
  v_recipients text[];
begin
  b := app.own_batch(p_batch_id);
  if b.stage <> p_expected then
    raise exception 'This batch was updated elsewhere — refresh and try again.';
  end if;
  v_idx := array_position(v_order, b.stage);
  if v_idx is null or v_idx = cardinality(v_order) then
    raise exception 'This batch is already complete.';
  end if;
  v_next := v_order[v_idx + 1];

  if b.stage = 'funding' then
    v_units := app.active_units(b.id);
    if v_units < b.funding_goal then
      raise exception 'Need % more pre-orders before production can start.', b.funding_goal - v_units;
    end if;
    update app.orders set status = 'charged' where batch_id = b.id and status = 'pledged';
  end if;
  if v_next = 'complete' and exists (
    select 1 from app.orders where batch_id = b.id and status not in ('shipped', 'refunded')
  ) then
    raise exception 'Ship every order before completing the batch.';
  end if;

  update app.batches set
    stage = v_next,
    stage_history = stage_history || jsonb_build_array(jsonb_build_object(
      'stage', v_next, 'at', app.iso(now()), 'note', trim(coalesce(p_note, '')), 'photoUrl', p_photo_url))
  where id = b.id;

  select array_agg(email) into v_recipients from app.orders where batch_id = b.id and status <> 'refunded';
  return jsonb_build_object(
    'stage', v_next,
    'notified', app.queue_email(b.id, 'stage', p_subject, p_message, v_recipients, v_next, p_photo_url)
  );
end $$;

create function public.cancel_batch(p_batch_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b app.batches;
  v_recipients text[];
begin
  b := app.own_batch(p_batch_id);
  if b.stage <> 'funding' then raise exception 'Only batches still in funding can be cancelled.'; end if;

  with refunded as (
    update app.orders set status = 'refunded' where batch_id = b.id and status <> 'refunded' returning email
  ) select array_agg(email) into v_recipients from refunded;

  update app.batches set
    stage = 'cancelled',
    stage_history = stage_history || jsonb_build_array(jsonb_build_object('stage', 'cancelled', 'at', app.iso(now()), 'note', ''))
  where id = b.id;

  perform app.queue_email(
    b.id, 'cancelled',
    format('%s didn''t reach its goal — you won''t be charged', b.title),
    format('Thank you for backing this batch. It didn''t reach its goal of %s pre-orders, so your card hold has been released and you haven''t been charged anything.', b.funding_goal),
    v_recipients);
  return jsonb_build_object('released', coalesce(cardinality(v_recipients), 0));
end $$;

create function public.mark_packaged(p_batch_id text, p_order_ids text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b app.batches;
  v_tier int;
  v_recipients text[];
begin
  b := app.own_batch(p_batch_id);
  if b.stage <> 'fulfillment' then raise exception 'Packing opens once the batch reaches fulfillment.'; end if;
  select coalesce(max(tier), 0) + 1 into v_tier from app.orders where batch_id = b.id;

  with packed as (
    update app.orders set status = 'packaged', tier = v_tier, packaged_at = now()
    where batch_id = b.id and id = any (p_order_ids) and status = 'charged'
    returning email
  ) select array_agg(email) into v_recipients from packed;

  perform app.queue_email(
    b.id, 'packaged',
    format('%s: Packaged & awaiting courier pickup 📦', b.title),
    format('Your %s are boxed and padded in packing tier %s. The courier collects them from the studio soon — we''ll email again the moment it''s on its way.', b.unit_label, v_tier),
    v_recipients);
  return jsonb_build_object('tier', v_tier, 'count', coalesce(cardinality(v_recipients), 0));
end $$;

create function public.mark_shipped(p_batch_id text, p_order_ids text[], p_courier text default 'India Post') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b app.batches;
  v_courier text := coalesce(nullif(trim(p_courier), ''), 'India Post');
  v_recipients text[];
begin
  b := app.own_batch(p_batch_id);

  with shipped as (
    update app.orders set
      status = 'shipped', courier = v_courier, shipped_at = now(),
      awb = 'AWB' || (1000000 + floor(random() * 9000000))::int
    where batch_id = b.id and id = any (p_order_ids) and status = 'packaged'
    returning email
  ) select array_agg(email) into v_recipients from shipped;

  perform app.queue_email(
    b.id, 'shipped',
    format('%s: Your order is on its way 🚚', b.title),
    format('Your %s have been handed to %s. Tap below to follow the delivery.', b.unit_label, v_courier),
    v_recipients);
  return jsonb_build_object('count', coalesce(cardinality(v_recipients), 0));
end $$;

/** Copies the demo studio's batches (with demo backers, comments and emails) into the caller's studio. */
create function public.load_sample_batches() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid text := app.require_creator();
  v_name text;
  v_sfx text := '-' || encode(extensions.gen_random_bytes(2), 'hex');
  v_count int;
begin
  select display_name into v_name from app.creators where id = v_uid;

  insert into app.batches (id, code, creator_id, title, tagline, description, unit_label, price,
    funding_goal, max_quantity, funding_deadline, cover_hue, stage, stage_history, created_at)
  select id || v_sfx, code, v_uid, title, tagline, description, unit_label, price,
    funding_goal, max_quantity, funding_deadline, cover_hue, stage, stage_history, created_at
  from app.batches where creator_id = 'seed_sarah';
  get diagnostics v_count = row_count;

  insert into app.orders (id, number, batch_id, buyer_name, email, quantity, address, city, pincode,
    status, tracking_token, tier, packaged_at, courier, awb, shipped_at, created_at)
  select o.id || v_sfx, o.number, o.batch_id || v_sfx, o.buyer_name, o.email, o.quantity, o.address,
    o.city, o.pincode, o.status, app.new_token(), o.tier, o.packaged_at, o.courier, o.awb, o.shipped_at, o.created_at
  from app.orders o join app.batches b on b.id = o.batch_id
  where b.creator_id = 'seed_sarah' and o.email like '%@example.com';

  insert into app.comments (id, batch_id, update_key, parent_id, author, body, created_at)
  select c.id || v_sfx, c.batch_id || v_sfx, c.update_key, c.parent_id || v_sfx,
    case when c.author ->> 'role' = 'creator'
      then jsonb_build_object('role', 'creator', 'creatorId', v_uid, 'name', v_name)
      else c.author || jsonb_build_object('orderId', (c.author ->> 'orderId') || v_sfx)
    end,
    c.body, c.created_at
  from app.comments c join app.batches b on b.id = c.batch_id
  where b.creator_id = 'seed_sarah' and c.id like 'c-seed-%';

  insert into app.outbox (id, batch_id, kind, stage, subject, body, photo_url, recipients, sent_at)
  select m.id || v_sfx, m.batch_id || v_sfx, m.kind, m.stage, m.subject, m.body, m.photo_url, m.recipients, m.sent_at
  from app.outbox m join app.batches b on b.id = m.batch_id
  where b.creator_id = 'seed_sarah' and m.id like 'mail-seed-%';

  return jsonb_build_object('count', v_count);
end $$;

/** Deletes every batch in the caller's studio (orders, comments and emails cascade). */
create function public.reset_my_studio() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  delete from app.batches where creator_id = app.require_user();
  get diagnostics v_count = row_count;
  return jsonb_build_object('deleted', v_count);
end $$;

-- ---------------------------------------------------------------- buyer writes

create function public.pledge(p_batch_id text, p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b app.batches;
  v_qty int := (p ->> 'quantity')::int;
  v_left int;
  v_n int;
  o app.orders;
begin
  select * into b from app.batches where id = p_batch_id for update;
  if not found then raise exception 'Batch not found'; end if;
  v_left := b.max_quantity - app.active_units(b.id);
  if b.stage <> 'funding' or b.funding_deadline < now() or v_left <= 0 then
    raise exception 'This batch is no longer accepting pre-orders.';
  end if;
  if v_qty is null or v_qty < 1 then raise exception 'Choose how many you''d like.'; end if;
  if v_qty > v_left then raise exception 'Only % left in this batch.', v_left; end if;
  if length(trim(coalesce(p ->> 'name', ''))) < 2 then raise exception 'Please enter your full name'; end if;
  if coalesce(p ->> 'email', '') !~ '^\S+@\S+\.\S+$' then raise exception 'Enter a valid email so we can send updates'; end if;
  if length(trim(coalesce(p ->> 'address', ''))) < 5 then raise exception 'Enter your street address'; end if;
  if length(trim(coalesce(p ->> 'city', ''))) < 2 then raise exception 'Enter your city'; end if;

  select count(*) + 1 into v_n from app.orders where batch_id = b.id;
  insert into app.orders (id, number, batch_id, buyer_name, email, quantity, address, city, pincode, tracking_token)
  values (
    app.new_id('o-'), b.code || '-' || lpad(v_n::text, 3, '0'), b.id, trim(p ->> 'name'),
    lower(trim(p ->> 'email')), v_qty, trim(p ->> 'address'), trim(p ->> 'city'), trim(p ->> 'pincode'),
    app.new_token()
  ) returning * into o;
  return app.order_json(o);
exception
  when check_violation then raise exception 'Please check your details (PIN code must be 6 digits).';
end $$;

/**
 * Public comment on a studio update. Backers pass their tracking token; the studio owner
 * passes null and is identified by their session.
 */
create function public.add_comment(
  p_batch_id text, p_update_key text, p_parent_id text, p_body text, p_token text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  b app.batches;
  v_text text := trim(coalesce(p_body, ''));
  parent app.comments;
  o app.orders;
  v_author jsonb;
  c app.comments;
begin
  select * into b from app.batches where id = p_batch_id;
  if not found then raise exception 'Batch not found'; end if;
  if v_text = '' then raise exception 'Write something first.'; end if;
  if length(v_text) > 500 then raise exception 'Comments are limited to 500 characters.'; end if;
  if not exists (
    select 1 from jsonb_array_elements(b.stage_history) h
    where (h ->> 'stage') || ':' || (h ->> 'at') = p_update_key
  ) then
    raise exception 'That update no longer exists.';
  end if;
  if p_parent_id is not null then
    select * into parent from app.comments where id = p_parent_id and batch_id = b.id;
    if not found then raise exception 'That comment was removed.'; end if;
  end if;

  if p_token is null then
    if app.current_user_id() is distinct from b.creator_id then
      raise exception 'Only the maker of this batch can reply as the studio.';
    end if;
    select jsonb_build_object('role', 'creator', 'creatorId', cr.id, 'name', cr.display_name)
      into v_author from app.creators cr where cr.id = b.creator_id;
  else
    select * into o from app.orders where tracking_token = p_token and batch_id = b.id and status <> 'refunded';
    if not found then raise exception 'Only backers of this batch can comment.'; end if;
    v_author := jsonb_build_object('role', 'buyer', 'name', o.buyer_name, 'orderId', o.id, 'orderNumber', o.number);
  end if;

  insert into app.comments (id, batch_id, update_key, parent_id, author, body)
  values (
    app.new_id('c-'), b.id, p_update_key,
    case when parent.id is null then null else coalesce(parent.parent_id, parent.id) end,
    v_author, v_text
  ) returning * into c;

  if v_author ->> 'role' = 'creator' and parent.author ->> 'role' = 'buyer' then
    select * into o from app.orders where id = parent.author ->> 'orderId';
    if found then
      perform app.queue_email(
        b.id, 'reply',
        format('%s replied to your comment on %s', v_author ->> 'name', b.title),
        format('“%s”' || chr(10) || chr(10) || 'You wrote: “%s”', v_text, parent.body),
        array[o.email]);
    end if;
  end if;
  return app.comment_json(c);
end $$;

create function public.delete_comment(p_comment_id text, p_token text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c app.comments;
  v_allowed boolean;
begin
  select * into c from app.comments where id = p_comment_id;
  if not found then return null; end if;
  if p_token is null then
    v_allowed := exists (select 1 from app.batches where id = c.batch_id and creator_id = app.current_user_id());
  else
    v_allowed := exists (select 1 from app.orders where tracking_token = p_token and id = c.author ->> 'orderId');
  end if;
  if not v_allowed then raise exception 'You can only delete your own comments.'; end if;
  delete from app.comments where id = c.id;
  return jsonb_build_object('id', c.id);
end $$;

-- ---------------------------------------------------------------- grants

revoke execute on all functions in schema app from public, anon, authenticated;
