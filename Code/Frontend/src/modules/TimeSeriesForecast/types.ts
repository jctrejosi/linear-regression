export interface ForecastRow {
  [key: string]: string | number;
}

export interface ForecastRequest {
  model_name: string;
  points: number;
  data: ForecastRow[];
}

export interface ForecastResponse {
  status: string;
  model_used: string;
  forecast: ForecastRow[];
}

export interface ModelItem {
  model_name: string;
  last_modified: string;
  size_kb: number;
}

export interface ModelsResponse {
  models: ModelItem[];
  count: number;
}
