export function adminLocalDemoEnabled(config:{environment?:string;host:string;staffMode?:string;bffMode?:string;apiUrl?:string}) {
  return config.environment==='development' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(config.host)
    && config.staffMode==='demo' && config.bffMode==='demo' && !config.apiUrl;
}
