export interface TestLogger {
  error: (m: string, o?: any) => void;
  pass: () => void;
}