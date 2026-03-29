/**
 * @param  {...(string | Record<string, boolean>)} configs
 * @returns {string}
 */
export default function cx(...configs) {
  return configs.map(
    config => typeof config === 'string' ?
      config :
      Object.keys(config).filter(k => config[k]).join(' '),
  ).join(' ');
}
