export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  stream: boolean;
}

export interface TaskConfig {
  id: string;
  prompt: string;
  imageUrl?: string;
}
