import type { Player } from "@/lib/types"

const T = {
  pumas:     "51111111-1111-4511-8111-111111111111",
  titanes:   "52222222-2222-4522-8222-222222222222",
  estrella:  "53333333-3333-4533-8333-333333333333",
  huracan:   "54444444-4444-4544-8444-444444444444",
  toros:     "55555555-5555-4555-8555-555555555555",
  aguilas:   "56666666-6666-4566-8666-666666666666",
  defensores:"57777777-7777-4577-8777-777777777777",
  leones:    "58888888-8888-4588-8888-888888888888",
}

export const players: Player[] = [
  // Los Pumas
  { id: "61111111-1111-4611-8111-111111111111", name: "Luciano Agüero", number: 1, position: "arquero", teamId: T.pumas, active: true },
  { id: "62222222-2222-4622-8222-222222222222", name: "Facundo Molina", number: 5, position: "defensa", teamId: T.pumas, active: true },
  { id: "63333333-3333-4633-8333-333333333333", name: "Matías Roldán", number: 7, position: "mediocampista", teamId: T.pumas, active: true },
  { id: "64444444-4444-4644-8444-444444444444", name: "Ignacio Pereyra", number: 9, position: "delantero", teamId: T.pumas, active: true },
  { id: "65555555-5555-4655-8555-555555555555", name: "Tomás Sosa", number: 10, position: "mediocampista", teamId: T.pumas, active: true },
  { id: "66666666-6666-4666-8666-666666666666", name: "Julián Castro", number: 11, position: "delantero", teamId: T.pumas, active: true },

  // Titanes
  { id: "67777777-7777-4677-8777-777777777777", name: "Santiago Morales", number: 1, position: "arquero", teamId: T.titanes, active: true },
  { id: "68888888-8888-4688-8888-888888888888", name: "Emiliano Paz", number: 4, position: "defensa", teamId: T.titanes, active: true },
  { id: "69999999-9999-4699-8999-999999999999", name: "Nahuel Acosta", number: 8, position: "mediocampista", teamId: T.titanes, active: true },
  { id: "6aaaaaaa-aaaa-46aa-8aaa-aaaaaaaaaaaa", name: "Franco Benítez", number: 10, position: "delantero", teamId: T.titanes, active: true },
  { id: "6bbbbbbb-bbbb-46bb-8bbb-bbbbbbbbbbbb", name: "Agustín Rojas", number: 14, position: "mediocampista", teamId: T.titanes, active: true },

  // Estrella Roja
  { id: "6ccccccc-cccc-46cc-8ccc-cccccccccccc", name: "Gonzalo Luna", number: 1, position: "arquero", teamId: T.estrella, active: true },
  { id: "6ddddddd-dddd-46dd-8ddd-dddddddddddd", name: "Fabricio Duarte", number: 3, position: "defensa", teamId: T.estrella, active: true },
  { id: "6eeeeeee-eeee-46ee-8eee-eeeeeeeeeeee", name: "Brian Ojeda", number: 6, position: "mediocampista", teamId: T.estrella, active: true },
  { id: "6fffffff-ffff-46ff-8fff-ffffffffffff", name: "Darío Montenegro", number: 9, position: "delantero", teamId: T.estrella, active: true },
  { id: "61000000-0000-4610-8010-000000000000", name: "Kevin Soria", number: 16, position: "delantero", teamId: T.estrella, active: false },

  // Huracán
  { id: "61100000-0000-4611-8011-000000000000", name: "Alan Vázquez", number: 1, position: "arquero", teamId: T.huracan, active: true },
  { id: "61200000-0000-4612-8012-000000000000", name: "Lautaro Giménez", number: 2, position: "defensa", teamId: T.huracan, active: true },
  { id: "61300000-0000-4613-8013-000000000000", name: "Rodrigo Ferreyra", number: 5, position: "mediocampista", teamId: T.huracan, active: true },
  { id: "61400000-0000-4614-8014-000000000000", name: "Joaquín Mansilla", number: 7, position: "delantero", teamId: T.huracan, active: true },
  { id: "61500000-0000-4615-8015-000000000000", name: "Thiago Correa", number: 11, position: "delantero", teamId: T.huracan, active: true },

  // Toros
  { id: "61600000-0000-4616-8016-000000000000", name: "Mauro Delgado", number: 1, position: "arquero", teamId: T.toros, active: true },
  { id: "61700000-0000-4617-8017-000000000000", name: "Diego Ponce", number: 4, position: "defensa", teamId: T.toros, active: true },
  { id: "61800000-0000-4618-8018-000000000000", name: "Cristian Morales", number: 8, position: "mediocampista", teamId: T.toros, active: true },
  { id: "61900000-0000-4619-8019-000000000000", name: "Ezequiel Campos", number: 10, position: "delantero", teamId: T.toros, active: true },

  // Águilas
  { id: "62000000-0000-4620-8020-000000000000", name: "Nicolás Fuentes", number: 1, position: "arquero", teamId: T.aguilas, active: true },
  { id: "62100000-0000-4621-8021-000000000000", name: "Alejo Rivas", number: 3, position: "defensa", teamId: T.aguilas, active: true },
  { id: "62200000-0000-4622-8022-000000000000", name: "Maximiliano Navarro", number: 6, position: "mediocampista", teamId: T.aguilas, active: true },
  { id: "62300000-0000-4623-8023-000000000000", name: "Lucas Medina", number: 9, position: "delantero", teamId: T.aguilas, active: true },
  { id: "62400000-0000-4624-8024-000000000000", name: "Camila Sosa", number: 11, position: "delantero", teamId: T.aguilas, active: true },

  // Defensores
  { id: "62500000-0000-4625-8025-000000000000", name: "Emmanuel Vera", number: 1, position: "arquero", teamId: T.defensores, active: true },
  { id: "62600000-0000-4626-8026-000000000000", name: "Ramiro Luna", number: 5, position: "defensa", teamId: T.defensores, active: true },
  { id: "62700000-0000-4627-8027-000000000000", name: "Marcos Pintos", number: 7, position: "mediocampista", teamId: T.defensores, active: true },
  { id: "62800000-0000-4628-8028-000000000000", name: "Ángel Romero", number: 10, position: "delantero", teamId: T.defensores, active: true },

  // Leones
  { id: "62900000-0000-4629-8029-000000000000", name: "Iván Mareco", number: 1, position: "arquero", teamId: T.leones, active: true },
  { id: "63000000-0000-4630-8030-000000000000", name: "Leandro Cabrera", number: 2, position: "defensa", teamId: T.leones, active: true },
  { id: "63100000-0000-4631-8031-000000000000", name: "Gastón Olivera", number: 4, position: "mediocampista", teamId: T.leones, active: true },
  { id: "63200000-0000-4632-8032-000000000000", name: "Jorge Benavídez", number: 9, position: "delantero", teamId: T.leones, active: true },
  { id: "63300000-0000-4633-8033-000000000000", name: "Francisco Godoy", number: 11, position: "delantero", teamId: T.leones, active: true },
]
