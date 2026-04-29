export const LOCATIONS: Record<
  string,
  { label: string; cities: string[] }
> = {
  at: {
    label: "Austria",
    cities: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt"],
  },
  de: {
    label: "Germany",
    cities: [
      "Berlin",
      "Munich",
      "Hamburg",
      "Frankfurt",
      "Cologne",
      "Stuttgart",
      "Düsseldorf",
      "Leipzig",
      "Dresden",
      "Nuremberg",
    ],
  },
  gb: {
    label: "United Kingdom",
    cities: [
      "London",
      "Manchester",
      "Birmingham",
      "Leeds",
      "Glasgow",
      "Edinburgh",
      "Bristol",
      "Liverpool",
    ],
  },
  us: {
    label: "United States",
    cities: [
      "New York",
      "San Francisco",
      "Seattle",
      "Austin",
      "Boston",
      "Chicago",
      "Los Angeles",
      "Denver",
    ],
  },
};