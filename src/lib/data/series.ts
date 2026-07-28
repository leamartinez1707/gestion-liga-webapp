import type { SeriesOption } from "@/components/series-selector"

export const seriesOptions: SeriesOption[] = [
  {
    id: "serie-1",
    name: "Serie 1",
    slug: "serie-1",
    divisions: [
      { id: "serie-1-a", name: "Div A" },
      { id: "serie-1-b", name: "Div B" },
      { id: "serie-1-c", name: "Div C" },
    ],
  },
  {
    id: "serie-2",
    name: "Serie 2",
    slug: "serie-2",
    divisions: [
      { id: "serie-2-a", name: "Div A" },
      { id: "serie-2-b", name: "Div B" },
    ],
  },
  {
    id: "mas-30",
    name: "+30",
    slug: "mas-30",
    divisions: [
      { id: "mas-30-unica", name: "Única" },
    ],
  },
  {
    id: "f8",
    name: "F8",
    slug: "f8",
    divisions: [
      { id: "f8-unica", name: "Única" },
    ],
  },
]
