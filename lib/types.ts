export interface Manse {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface StoredResult {
  name: string;
  manse: Manse;
  createdAt: string;
  catMode: boolean;
  model: string;
}
