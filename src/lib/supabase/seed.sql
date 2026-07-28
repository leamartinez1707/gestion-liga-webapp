-- =============================================================================
-- Seed Data: Gestión Ligas — Admin Panel
-- Description: Sample data for development and testing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tournaments
-- -----------------------------------------------------------------------------
insert into tournaments (id, name, category, season, format, start_date, end_date) values
  ('a0000000-0000-0000-0000-000000000001', 'Liga Metropolitana de Futsal 2026', 'Primera División', '2026', 'league', '2026-04-01', '2026-11-30'),
  ('a0000000-0000-0000-0000-000000000002', 'Liga Metropolitana de Futsal 2026', 'Segunda División', '2026', 'league', '2026-04-01', '2026-11-30');

-- -----------------------------------------------------------------------------
-- Teams
-- -----------------------------------------------------------------------------
insert into teams (id, name, short_name, category, coach, assistant_coach, tournament_id) values
  ('b0000000-0000-0000-0000-000000000001', 'Club Atlético Los Pumas', 'Los Pumas', 'Primera División', 'Carlos Rodríguez', 'Martín Gómez', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'Titanes Futsal Club', 'Titanes', 'Primera División', 'Diego Fernández', null, 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'Deportivo Estrella Roja', 'Estrella Roja', 'Primera División', 'Pablo Martínez', 'Lucas Silva', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000004', 'Sportivo Huracán', 'Huracán', 'Primera División', 'Alejandro Torres', 'Gabriel Ríos', 'a0000000-0000-0000-0000-000000000001');

-- -----------------------------------------------------------------------------
-- Players
-- -----------------------------------------------------------------------------
-- Los Pumas
insert into players (id, name, number, position, team_id, active) values
  ('c0000000-0000-0000-0000-000000000001', 'Luciano Agüero', 1, 'arquero', 'b0000000-0000-0000-0000-000000000001', true),
  ('c0000000-0000-0000-0000-000000000002', 'Facundo Molina', 5, 'defensa', 'b0000000-0000-0000-0000-000000000001', true),
  ('c0000000-0000-0000-0000-000000000003', 'Matías Roldán', 7, 'mediocampista', 'b0000000-0000-0000-0000-000000000001', true),
  ('c0000000-0000-0000-0000-000000000004', 'Ignacio Pereyra', 9, 'delantero', 'b0000000-0000-0000-0000-000000000001', true),
  ('c0000000-0000-0000-0000-000000000005', 'Tomás Sosa', 10, 'mediocampista', 'b0000000-0000-0000-0000-000000000001', true);

-- Titanes
insert into players (id, name, number, position, team_id, active) values
  ('c0000000-0000-0000-0000-000000000006', 'Santiago Morales', 1, 'arquero', 'b0000000-0000-0000-0000-000000000002', true),
  ('c0000000-0000-0000-0000-000000000007', 'Emiliano Paz', 4, 'defensa', 'b0000000-0000-0000-0000-000000000002', true),
  ('c0000000-0000-0000-0000-000000000008', 'Nahuel Acosta', 8, 'mediocampista', 'b0000000-0000-0000-0000-000000000002', true),
  ('c0000000-0000-0000-0000-000000000009', 'Franco Benítez', 10, 'delantero', 'b0000000-0000-0000-0000-000000000002', true),
  ('c0000000-0000-0000-0000-000000000010', 'Agustín Rojas', 14, 'mediocampista', 'b0000000-0000-0000-0000-000000000002', true);

-- Estrella Roja
insert into players (id, name, number, position, team_id, active) values
  ('c0000000-0000-0000-0000-000000000011', 'Gonzalo Luna', 1, 'arquero', 'b0000000-0000-0000-0000-000000000003', true),
  ('c0000000-0000-0000-0000-000000000012', 'Fabricio Duarte', 3, 'defensa', 'b0000000-0000-0000-0000-000000000003', true),
  ('c0000000-0000-0000-0000-000000000013', 'Brian Ojeda', 6, 'mediocampista', 'b0000000-0000-0000-0000-000000000003', true),
  ('c0000000-0000-0000-0000-000000000014', 'Darío Montenegro', 9, 'delantero', 'b0000000-0000-0000-0000-000000000003', true),
  ('c0000000-0000-0000-0000-000000000015', 'Kevin Soria', 16, 'delantero', 'b0000000-0000-0000-0000-000000000003', false);

-- Huracán
insert into players (id, name, number, position, team_id, active) values
  ('c0000000-0000-0000-0000-000000000016', 'Alan Vázquez', 1, 'arquero', 'b0000000-0000-0000-0000-000000000004', true),
  ('c0000000-0000-0000-0000-000000000017', 'Lautaro Giménez', 2, 'defensa', 'b0000000-0000-0000-0000-000000000004', true),
  ('c0000000-0000-0000-0000-000000000018', 'Rodrigo Ferreyra', 5, 'mediocampista', 'b0000000-0000-0000-0000-000000000004', true),
  ('c0000000-0000-0000-0000-000000000019', 'Joaquín Mansilla', 7, 'delantero', 'b0000000-0000-0000-0000-000000000004', true),
  ('c0000000-0000-0000-0000-000000000020', 'Thiago Correa', 11, 'delantero', 'b0000000-0000-0000-0000-000000000004', true);

-- -----------------------------------------------------------------------------
-- Matches
-- -----------------------------------------------------------------------------
insert into matches (id, tournament_id, home_team_id, away_team_id, matchday, date, time, home_score, away_score, status, venue) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 1, '2026-04-05', '20:00', 3, 2, 'finished', 'Gimnasio Municipal N°1'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 1, '2026-04-05', '22:00', 1, 1, 'finished', 'Gimnasio Municipal N°2'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 2, '2026-04-12', '20:00', null, null, 'scheduled', 'Gimnasio Municipal N°1'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 2, '2026-04-12', '22:00', null, null, 'scheduled', 'Gimnasio Municipal N°2'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 3, '2026-04-19', '20:00', null, null, 'scheduled', 'Gimnasio Municipal N°1'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 3, '2026-04-19', '22:00', null, null, 'scheduled', 'Gimnasio Municipal N°2');

-- -----------------------------------------------------------------------------
-- Sanctions
-- -----------------------------------------------------------------------------
insert into sanctions (id, player_id, match_id, card_type, match_date, matches_suspended, expires_after_match) values
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'yellow', '2026-04-05', 0, null),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000001', 'yellow', '2026-04-05', 0, null),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002', 'red', '2026-04-05', 2, 3),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000002', 'yellow', '2026-04-05', 0, null);

-- -----------------------------------------------------------------------------
-- News Articles
-- -----------------------------------------------------------------------------
insert into news_articles (id, title, excerpt, content, author, category, published, date) values
  ('f0000000-0000-0000-0000-000000000001',
   'Comienza la temporada 2026',
   'La Liga Metropolitana de Futsal da inicio a su temporada 2026 con 8 equipos en dos divisiones.',
   'Contenido completo del artículo de inicio de temporada...',
   'Prensa LMF', 'Temporada', true, '2026-04-01'),
  ('f0000000-0000-0000-0000-000000000002',
   'Los Pumas arrancan con victoria',
   'En un partido vibrante, Los Pumas vencieron 3-2 a Titanes en la fecha inaugural.',
   'Contenido completo del artículo del partido...',
   'Prensa LMF', 'Partidos', true, '2026-04-05'),
  ('f0000000-0000-0000-0000-000000000003',
   'Estrella Roja y Huracán empatan en el debut',
   'Un discreto 1-1 entre dos candidatos al título de la Primera División.',
   'Contenido completo del artículo del empate...',
   'Prensa LMF', 'Partidos', true, '2026-04-05');
