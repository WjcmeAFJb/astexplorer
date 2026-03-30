export default function cx(...configs: (string | Record<string, boolean>)[]): string {
  return configs.map(
    config => typeof config === 'string' ?
      config :
      Object.keys(config).filter(k => config[k]).join(' '),
  ).join(' ');
}
