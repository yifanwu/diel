// if there are any errors, it will throw an exception
export const STRICT = true;
export const VERBOSE = true;
export const DEBUG = true;

// the following are demo configs
export const DEMO_WITH_SOCKET = false;
export const DEMO_WITH_LARGE_WEBWORKER = false;
export const DEMO_WITH_SMALL_WEBWORKER = true;
export const DEMO_WITH_WEBWORKER = DEMO_WITH_SMALL_WEBWORKER || DEMO_WITH_LARGE_WEBWORKER;
