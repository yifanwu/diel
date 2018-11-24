declare module 'sql-formatter' {
  export function format(query: string, confi?: {language: string, indent: string}): string;
}