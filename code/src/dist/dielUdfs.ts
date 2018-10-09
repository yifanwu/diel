export function log(msg: string, source: string) {
  console.log(`[${source}] ${msg}`);
  return 1;
}

export function timeNow() {
  return +new Date();
}