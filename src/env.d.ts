interface ImportMetaEnv {
  /** "true" in the e2e build only (npm run build:test): installs window.__toft. Never set for production. */
  readonly PUBLIC_TEST_HOOKS?: string;
}
