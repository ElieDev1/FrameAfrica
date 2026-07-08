export interface Integration {
  key: string;
  label: string;
  description: string;
  secret: boolean;
  isSet: boolean;
  source: 'database' | 'environment' | 'none';
  maskedValue: string | null;
  updatedAt: string | null;
}
