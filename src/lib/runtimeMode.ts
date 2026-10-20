/** Demo is an explicit, isolated local environment, never a connection fallback. */
export function runtimeModeAllowed(config: {
  environment?: string; hostname: string; staffMode?: string; guestMode?: string;
  bffMode?: string; apiUrl?: string;
}) {
  const modes = [config.staffMode, config.guestMode, config.bffMode];
  const demo = modes.some(mode => mode === 'demo');
  if (!demo) return config.staffMode === 'spring' && config.guestMode === 'spring'
    && config.bffMode === 'api' && Boolean(config.apiUrl?.trim());
  return ['development', 'test'].includes(config.environment ?? '')
    && ['localhost', '127.0.0.1', '[::1]'].includes(config.hostname)
    && modes.every(mode => mode === 'demo') && !config.apiUrl?.trim();
}
