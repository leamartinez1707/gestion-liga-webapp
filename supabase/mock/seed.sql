-- =============================================================================
-- MOCK DATA to see the app working. Not a migration: run it by hand.
--
-- Creates, in Serie 1 División A, Serie 1 División B and Serie 2 División A:
--   8 teams per division, 14 players per team, a finished "Apertura 2025" and
--   a "Clausura 2026" (fechas 1-5 played, 6-7 to play), live-sheet events
--   (goals, assists, cards), lineups (11 per team), 4 referees, news linked to matches, photo albums,
--   squad photos per season and sponsors.
--
-- Every mock row has an id starting with d0d0 (and referees an @mock.liga
-- email), so supabase/mock/cleanup.sql removes exactly this and nothing else.
-- Images come from api.dicebear.com (shields, faces), picsum.photos (photos)
-- and placehold.co (sponsor logos).
-- =============================================================================
do $$
declare
  v_admin uuid := (select id from public.profiles where role = 'superadmin' order by created_at limit 1);
  v_series uuid[] := array['11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']::uuid[];
  v_divs uuid[] := array['31111111-1111-4311-8111-111111111111', '32222222-2222-4322-8222-222222222222', '34444444-4444-4344-8444-444444444444']::uuid[];
  v_team_names text[] := array[
    'Club Atlético La Rotonda', 'Deportivo Malvín Norte', 'Sporting Cerrito', 'Real Pocitos FC',
    'Unión del Prado', 'Juventud Buceo', 'Racing de la Teja', 'Estrella del Cordón',
    'Defensor Brazo Oriental', 'Atlético Punta Carretas', 'Wanderers del Sur', 'Rampla Amigos',
    'Fénix de Maroñas', 'Liverpool Barrio Sur', 'Cerro Largo United', 'Danubio Social',
    'Bella Vista Unidos', 'Progreso Aguada', 'Huracán del Paso', 'Central Colón',
    'Tanque Sisley FC', 'Villa Española Junior', 'Basáñez Fútbol Club', 'Miramar del Este'];
  v_short text[] := array[
    'La Rotonda', 'Malvín Norte', 'Sp. Cerrito', 'Real Pocitos', 'U. del Prado', 'Juv. Buceo', 'Racing Teja', 'Estrella Cordón',
    'Def. Brazo', 'Punta Carretas', 'Wanderers Sur', 'Rampla Amigos', 'Fénix Maroñas', 'Liverpool BS', 'Cerro Largo U.', 'Danubio Social',
    'Bella Vista U.', 'Progreso Aguada', 'Huracán Paso', 'Central Colón', 'Tanque Sisley', 'V. Española Jr', 'Basáñez FC', 'Miramar Este'];
  v_first text[] := array['Santiago', 'Agustín', 'Matías', 'Nicolás', 'Facundo', 'Gonzalo', 'Diego', 'Federico', 'Martín', 'Joaquín',
    'Rodrigo', 'Sebastián', 'Bruno', 'Lucas', 'Maximiliano', 'Emiliano', 'Franco', 'Gastón', 'Ignacio', 'Juan Pablo',
    'Leandro', 'Mauricio', 'Pablo', 'Ramiro', 'Thiago', 'Valentín', 'Cristian', 'Fabricio', 'Germán', 'Hernán'];
  v_last text[] := array['Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Suárez',
    'Silva', 'Pereira', 'Cabrera', 'Díaz', 'Álvarez', 'Ramírez', 'Núñez', 'Sosa', 'Acosta', 'Benítez',
    'Morales', 'Barán', 'Aldo', 'Baldi', 'Castro', 'Olivera', 'Vázquez', 'Correa', 'Techera', 'De León'];
  v_venues text[] := array['Complejo Los Aromos', 'Cancha Parque Rodó', 'Complejo Cerro Norte'];
  v_times text[] := array['13:45', '15:30', '17:15', '19:00'];
  v_dates26 date[] := array['2026-08-09', '2026-08-23', '2026-09-06', '2026-09-20', '2026-10-04', '2026-10-11', '2026-10-18']::date[];
  v_refs uuid[] := '{}';
  v_ref_names text[] := array['Gustavo Méndez', 'Alejandro Pintos', 'Marcelo Ferreira', 'Daniel Rivero'];
  v_d int; v_k int; v_p int; v_r int; v_i int; v_s int; v_g int; v_n int; v_side int;
  v_team uuid; v_tour uuid; v_match uuid; v_home uuid; v_away uuid; v_scorer uuid; v_assist uuid; v_pl uuid;
  v_order int[]; v_ti int; v_date date; v_status text;
  v_m record; v_news int := 0; v_ref uuid;
  v_numbers int[] := array[1, 12, 2, 3, 4, 6, 5, 8, 10, 14, 7, 9, 11, 19];
begin
  if v_admin is null then raise exception 'No hay superadmin para firmar los datos.'; end if;
  if exists (select 1 from public.teams where id::text like 'd0d0%') then
    raise exception 'Los datos mock ya están cargados. Corré supabase/mock/cleanup.sql primero.';
  end if;
  perform setseed(0.42);
  -- Act as the superadmin so recompute_match() (staff only) can run
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  -- ---- Referees (accounts for display; they can't log in) ----
  for v_i in 1..4 loop
    v_ref := ('d0d0' || substr(md5('ref-' || v_i), 5))::uuid;
    -- Empty strings (not NULL) in the token columns: Auth fails to list users otherwise
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', v_ref, 'authenticated', 'authenticated',
      'arbitro' || v_i || '@mock.liga', '', now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}', '{}', now(), now());
    update public.profiles set role = 'referee', display_name = v_ref_names[v_i] where id = v_ref;
    v_refs := v_refs || v_ref;
  end loop;

  -- ---- Sponsors ----
  insert into public.sponsors (id, name, logo_url, link_url, display_order) values
    (('d0d0' || substr(md5('sp-1'), 5))::uuid, 'Ferretería El Tornillo', 'https://placehold.co/400x160/0b1d3a/ffffff/png?text=El+Tornillo', null, 10),
    (('d0d0' || substr(md5('sp-2'), 5))::uuid, 'Parrilla Don Tito', 'https://placehold.co/400x160/b91c1c/ffffff/png?text=Don+Tito', null, 11),
    (('d0d0' || substr(md5('sp-3'), 5))::uuid, 'Deportes Uno', 'https://placehold.co/400x160/15803d/ffffff/png?text=Deportes+Uno', null, 12);

  for v_d in 1..3 loop
    -- ---- Tournaments ----
    insert into public.tournaments (id, name, series_id, division_id, season, format, start_date, end_date) values
      (('d0d0' || substr(md5('tour-' || v_d || '-2025'), 5))::uuid, 'Apertura 2025', v_series[v_d], v_divs[v_d], '2025', 'league', '2025-03-09', '2025-04-27'),
      (('d0d0' || substr(md5('tour-' || v_d || '-2026'), 5))::uuid, 'Clausura 2026', v_series[v_d], v_divs[v_d], '2026', 'league', '2026-08-09', '2026-10-18');

    -- ---- Teams, players, registrations, lista de buena fe, squad photos ----
    for v_k in 1..8 loop
      v_ti := (v_d - 1) * 8 + v_k;
      v_team := ('d0d0' || substr(md5('team-' || v_ti), 5))::uuid;
      insert into public.teams (id, name, short_name, shield_url, coach, series_id, division_id)
      values (v_team, v_team_names[v_ti], v_short[v_ti],
        'https://api.dicebear.com/9.x/shapes/svg?seed=' || replace(v_short[v_ti], ' ', '') || '&backgroundColor=ffffff',
        v_first[1 + floor(random() * 30)::int] || ' ' || v_last[1 + floor(random() * 30)::int],
        v_series[v_d], v_divs[v_d]);

      for v_p in 1..14 loop
        insert into public.players (id, name, number, position, photo_url, team_id, active)
        values (('d0d0' || substr(md5('pl-' || v_ti || '-' || v_p), 5))::uuid,
          v_first[1 + floor(random() * 30)::int] || ' ' || v_last[1 + floor(random() * 30)::int],
          v_numbers[v_p],
          case when v_p <= 2 then 'arquero' when v_p <= 6 then 'defensa' when v_p <= 10 then 'mediocampista' else 'delantero' end,
          case when random() < 0.7 then 'https://api.dicebear.com/9.x/notionists/svg?seed=' || v_ti || '-' || v_p || '&backgroundColor=e2e8f0' end,
          v_team, true);
      end loop;

      for v_s in 2025..2026 loop
        insert into public.registrations (id, tournament_id, team_id)
        values (('d0d0' || substr(md5('reg-' || v_ti || '-' || v_s), 5))::uuid,
          ('d0d0' || substr(md5('tour-' || v_d || '-' || v_s), 5))::uuid, v_team);
        -- 2025 list: players 1-12; 2026: the whole squad
        insert into public.registration_players (registration_id, player_id)
        select ('d0d0' || substr(md5('reg-' || v_ti || '-' || v_s), 5))::uuid, ('d0d0' || substr(md5('pl-' || v_ti || '-' || n), 5))::uuid
        from generate_series(1, case when v_s = 2025 then 12 else 14 end) n;
        insert into public.team_season_photos (id, team_id, season, url)
        values (('d0d0' || substr(md5('tsp-' || v_ti || '-' || v_s), 5))::uuid, v_team, v_s::text,
          'https://picsum.photos/seed/plantel-' || v_ti || '-' || v_s || '/1600/1000');
      end loop;
    end loop;

    -- ---- Fixtures: single round robin (circle method), 7 fechas ----
    for v_s in 2025..2026 loop
      v_tour := ('d0d0' || substr(md5('tour-' || v_d || '-' || v_s), 5))::uuid;
      for v_r in 0..6 loop
        v_order := array[0];
        for v_i in 0..6 loop v_order := v_order || (1 + ((v_i + v_r) % 7)); end loop;
        for v_i in 0..3 loop
          v_home := ('d0d0' || substr(md5('team-' || ((v_d - 1) * 8 + 1 + v_order[1 + v_i])), 5))::uuid;
          v_away := ('d0d0' || substr(md5('team-' || ((v_d - 1) * 8 + 1 + v_order[8 - v_i])), 5))::uuid;
          if v_r % 2 = 1 then v_team := v_home; v_home := v_away; v_away := v_team; end if;
          v_date := case when v_s = 2025 then date '2025-03-09' + v_r * 7 else v_dates26[v_r + 1] end;
          v_status := case when v_s = 2025 or v_r < 5 then 'finished' else 'scheduled' end;
          v_match := ('d0d0' || substr(md5('m-' || v_d || '-' || v_s || '-' || v_r || '-' || v_i), 5))::uuid;
          insert into public.matches (id, tournament_id, home_team_id, away_team_id, matchday, date, time, venue, status, referee_id)
          values (v_match, v_tour, v_home, v_away, v_r + 1, v_date, v_times[v_i + 1]::time, v_venues[1 + (v_i % 3)], v_status,
            v_refs[1 + floor(random() * 4)::int]);

          if v_status = 'finished' then
            for v_side in 0..1 loop
              v_team := case when v_side = 0 then v_home else v_away end;
              v_ti := (select n from generate_series(1, 24) n where ('d0d0' || substr(md5('team-' || n), 5))::uuid = v_team);
              -- Goals (forwards score most), with an assist 60% of the time
              v_g := (array[0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5])[1 + floor(random() * 12)::int];
              for v_n in 1..v_g loop
                v_p := case when random() < 0.55 then 11 + floor(random() * 4)::int
                            when random() < 0.8 then 7 + floor(random() * 4)::int
                            else 3 + floor(random() * 4)::int end;
                v_scorer := ('d0d0' || substr(md5('pl-' || v_ti || '-' || v_p), 5))::uuid;
                v_assist := case when random() < 0.6 then
                  ('d0d0' || substr(md5('pl-' || v_ti || '-' || (3 + ((v_p - 3 + 1 + floor(random() * 10)::int) % 12))), 5))::uuid end;
                if v_assist = v_scorer then v_assist := null; end if;
                insert into public.match_events (id, match_id, team_id, player_id, assist_player_id, type, period, created_at)
                values (('d0d0' || substr(md5('ev-' || v_match || '-' || v_side || '-g' || v_n), 5))::uuid, v_match, v_team, v_scorer, v_assist,
                  'goal', case when random() < 0.5 then '1T' else '2T' end, v_date + (v_n * 7 + v_side) * interval '1 minute');
              end loop;
              -- Cards
              v_g := (array[0, 1, 1, 2, 2, 3])[1 + floor(random() * 6)::int];
              for v_n in 1..v_g loop
                insert into public.match_events (id, match_id, team_id, player_id, type, period, created_at)
                values (('d0d0' || substr(md5('ev-' || v_match || '-' || v_side || '-y' || v_n), 5))::uuid, v_match, v_team,
                  ('d0d0' || substr(md5('pl-' || v_ti || '-' || (2 + floor(random() * 13)::int)), 5))::uuid,
                  'yellow', case when random() < 0.5 then '1T' else '2T' end, v_date + (60 + v_n) * interval '1 minute');
              end loop;
              if random() < 0.08 then
                insert into public.match_events (id, match_id, team_id, player_id, type, period, created_at)
                values (('d0d0' || substr(md5('ev-' || v_match || '-' || v_side || '-r'), 5))::uuid, v_match, v_team,
                  ('d0d0' || substr(md5('pl-' || v_ti || '-' || (3 + floor(random() * 12)::int)), 5))::uuid,
                  'red', '2T', v_date + 80 * interval '1 minute');
              end if;
            end loop;
          end if;
        end loop;
      end loop;
    end loop;
  end loop;

  -- ---- Score, scorers, cards and suspensions, as the live sheet does ----
  for v_m in select id from public.matches where id::text like 'd0d0%' and status = 'finished' order by date loop
    perform public.recompute_match(v_m.id);
  end loop;

  -- ---- Lineups: 11 per team; whoever scored, assisted or got a card played ----
  insert into public.match_lineups (id, match_id, team_id, player_id, is_guest)
  select ('d0d0' || substr(md5('lu-' || x.match_id || '-' || x.player_id), 5))::uuid, x.match_id, x.team_id, x.player_id, x.is_guest
  from (
    select y.*, row_number() over (partition by y.match_id, y.team_id order by y.has_ev desc, y.is_guest, md5(y.match_id::text || y.player_id::text)) rn
    from (
      select m.id match_id, p.team_id, p.id player_id,
        exists (select 1 from public.match_events e where e.match_id = m.id and (e.player_id = p.id or e.assist_player_id = p.id)) has_ev,
        not exists (
          select 1 from public.registration_players rp join public.registrations r on r.id = rp.registration_id
          where r.tournament_id = m.tournament_id and r.team_id = p.team_id and rp.player_id = p.id) is_guest
      from public.matches m
      join public.players p on p.team_id in (m.home_team_id, m.away_team_id)
      where m.id::text like 'd0d0%' and m.status = 'finished'
    ) y
  ) x
  where (x.rn <= 11 or x.has_ev) and (not x.is_guest or x.has_ev);

  -- ---- News: a report for the last two fechas of each division, plus the season opener ----
  for v_m in
    select m.id, m.date, m.home_score, m.away_score, m.matchday, h.name hn, h.short_name hs, a.name an, a.short_name as_, t.series_id,
      (select string_agg(p.name || case when g.goals > 1 then ' (' || g.goals || ')' else '' end, ', ')
         from public.goals g join public.players p on p.id = g.player_id where g.match_id = m.id) scorers
    from public.matches m
    join public.teams h on h.id = m.home_team_id
    join public.teams a on a.id = m.away_team_id
    join public.tournaments t on t.id = m.tournament_id
    where m.id::text like 'd0d0%' and t.season = '2026' and m.status = 'finished' and m.matchday >= 4
    order by m.date desc, m.time
  loop
    v_news := v_news + 1;
    exit when v_news > 12;
    insert into public.news_articles (id, title, excerpt, content, image_url, author, category, published, date, series_id, match_id)
    values (('d0d0' || substr(md5('news-' || v_m.id), 5))::uuid,
      case when v_m.home_score > v_m.away_score then v_m.hs || ' le ganó ' || v_m.home_score || '-' || v_m.away_score || ' a ' || v_m.as_
           when v_m.home_score < v_m.away_score then v_m.as_ || ' se lo llevó ' || v_m.away_score || '-' || v_m.home_score || ' en la cancha de ' || v_m.hs
           else v_m.hs || ' y ' || v_m.as_ || ' igualaron ' || v_m.home_score || '-' || v_m.away_score end,
      'Fecha ' || v_m.matchday || ' del Clausura 2026: ' || v_m.hn || ' ' || v_m.home_score || ' - ' || v_m.away_score || ' ' || v_m.an || '.',
      'Se jugó la fecha ' || v_m.matchday || ' del Clausura 2026 y ' || v_m.hn || ' recibió a ' || v_m.an || ' en un partido muy disputado de principio a fin.' || E'\n\n' ||
      case when v_m.scorers is not null then 'Los goles fueron de ' || v_m.scorers || '. ' else 'El partido terminó sin goles. ' end ||
      'Los dos equipos tuvieron sus chances y la hinchada acompañó toda la tarde.' || E'\n\n' ||
      'Con este resultado, la tabla de posiciones sigue apretada de cara a las últimas fechas del torneo.',
      'https://picsum.photos/seed/cronica-' || v_news || '/1600/1000', 'Prensa de la liga', 'Partidos', true, v_m.date, v_m.series_id, v_m.id);
  end loop;

  insert into public.news_articles (id, title, excerpt, content, image_url, author, category, published, date, series_id)
  values
    (('d0d0' || substr(md5('news-open-1'), 5))::uuid, 'Arrancó el Clausura 2026 con 16 equipos en la Serie 1',
     'Las divisiones A y B ya pusieron primera en el segundo torneo del año.',
     'Con muy buena concurrencia en todas las canchas arrancó el Clausura 2026 de la Serie 1.' || E'\n\n' ||
     'Este torneo se juega todos contra todos y los primeros de cada división accederán a la final del año.',
     'https://picsum.photos/seed/arranque-1/1600/1000', 'Prensa de la liga', 'Torneos', true, '2026-08-08', '11111111-1111-4111-8111-111111111111'),
    (('d0d0' || substr(md5('news-open-2'), 5))::uuid, 'Se viene una nueva edición de la Serie 2',
     'Ocho equipos buscan el título de la División A.',
     'La Serie 2 vuelve con su División A y ocho equipos que prometen pelear hasta la última fecha.',
     'https://picsum.photos/seed/arranque-2/1600/1000', 'Prensa de la liga', 'Torneos', true, '2026-08-07', '22222222-2222-4222-8222-222222222222');

  -- ---- Photo albums of the last played fecha (8 photos each) ----
  v_n := 0;
  for v_m in
    select m.id, m.date, h.short_name hs, a.short_name as_, t.series_id
    from public.matches m
    join public.teams h on h.id = m.home_team_id
    join public.teams a on a.id = m.away_team_id
    join public.tournaments t on t.id = m.tournament_id
    where m.id::text like 'd0d0%' and t.season = '2026' and m.matchday = 5
    order by m.time
  loop
    v_n := v_n + 1;
    exit when v_n > 6;
    insert into public.photo_albums (id, title, description, date, series_id, match_id, cover_url, published)
    values (('d0d0' || substr(md5('album-' || v_m.id), 5))::uuid, v_m.hs || ' vs ' || v_m.as_, 'Fotos de la fecha 5 del Clausura 2026.',
      v_m.date, v_m.series_id, v_m.id, 'https://picsum.photos/seed/album-' || v_n || '-1/1600/1067', true);
    insert into public.photos (id, album_id, url, thumb_url, caption, display_order)
    select ('d0d0' || substr(md5('photo-' || v_m.id || '-' || i), 5))::uuid, ('d0d0' || substr(md5('album-' || v_m.id), 5))::uuid,
      'https://picsum.photos/seed/album-' || v_n || '-' || i || '/1600/1067',
      'https://picsum.photos/seed/album-' || v_n || '-' || i || '/480/320', null, i
    from generate_series(1, 8) i;
  end loop;

  -- ---- Champions of the finished 2025 tournaments: the standings leader ----
  update public.tournaments t set champion_team_id = (
    select team_id from (
      select m.home_team_id team_id,
        case when m.home_score > m.away_score then 3 when m.home_score = m.away_score then 1 else 0 end pts,
        m.home_score - m.away_score gd, m.home_score gf
      from public.matches m where m.tournament_id = t.id and m.status = 'finished'
      union all
      select m.away_team_id,
        case when m.away_score > m.home_score then 3 when m.away_score = m.home_score then 1 else 0 end,
        m.away_score - m.home_score, m.away_score
      from public.matches m where m.tournament_id = t.id and m.status = 'finished'
    ) r group by team_id order by sum(pts) desc, sum(gd) desc, sum(gf) desc limit 1)
  where t.id::text like 'd0d0%' and t.season = '2025';
end $$;
