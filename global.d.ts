export {};

declare global {
  var authLogout: (() => Promise<void>) | undefined;
}
