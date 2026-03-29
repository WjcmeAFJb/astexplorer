import PropTypes from 'prop-types';
import React from 'react';

/** @typedef {import('../../types.js').SettingsConfiguration} SettingsConfiguration */

/** @type {(v: string) => string | number} */
const identity = v => v;

function valuesFromArray(/** @type {Record<string, Function>} */ settings) {
  return settings.reduce(
    (/** @type {Record<string, unknown>} */ obj, /** @type {string} */ name) => (
      (obj[name] = settings.indexOf(name) > -1),
      obj
    ),
    /** @type {Record<string, unknown>} */ ({}),
  );
}

function getValuesFromSettings(/** @type {Record<string, Function>} */ settings) {
  if (Array.isArray(settings)) {
    return valuesFromArray(settings);
  }
  return settings;
}

function defaultUpdater(/** @type {Record<string, Function>} */ settings, /** @type {string} */ name, /** @type {unknown} */ value) {
  return {...settings, [name]: value};
}

function arrayUpdater(/** @type {Record<string, Function>} */ settings, /** @type {string} */ name, /** @type {unknown} */ value) {
  settings = new Set(settings);
  if (value) {
    settings.add(name);
  } else {
    settings.delete(name);
  }
  return Array.from(settings);
}

function getUpdateStrategy(/** @type {Record<string, Function>} */ settings) {
  if (Array.isArray(settings)) {
    return arrayUpdater;
  }
  return defaultUpdater;
}

/**
 * @param {Object} props
 * @param {SettingsConfiguration} props.settingsConfiguration
 * @param {Record<string, unknown>} props.parserSettings
 * @param {(settings: Record<string, unknown>) => void} props.onChange
 * @returns {React.ReactElement}
 */
export default function SettingsRenderer(props) {
  const {settingsConfiguration, parserSettings, onChange} = props;
  const {
    title,
    fields,
    required = new Set(),
    update=getUpdateStrategy(parserSettings),
  } = settingsConfiguration;
  const values =
    (settingsConfiguration.values || getValuesFromSettings)(parserSettings);

  return (
    <div>
      {title ? <h4>{title}</h4> : null}
      <ul className="settings">
        {fields.map(setting => {
          if (typeof setting === 'string') {
            return (
              <li key={setting}>
                <label>
                  <input
                    type="checkbox"
                    readOnly={required.has(setting)}
                    disabled={required.has(setting)}
                    checked={values[setting]}
                    onChange={
                      ({target}) => onChange(
                        update(parserSettings, setting, target.checked),
                      )
                    }
                  />
                  &nbsp;{setting}
                </label>
              </li>
            );
          } else if(Array.isArray(setting)) {
            const [fieldName, options, converter=identity] = setting;
            return (
              <li key={fieldName}>
                <label>
                  {fieldName}:&nbsp;
                  <select
                    onChange={
                      ({target}) => onChange(update(
                        parserSettings,
                        fieldName,
                        converter(target.value),
                      ))
                    }
                    value={values[fieldName]}>
                    {Array.isArray(options) ?
                      options.map(o => <option key={o} value={o}>{o}</option>) :
                      Object.keys(options).map(
                        key => <option key={key} value={options[key]}>{key}</option>,
                      )
                    }
                  </select>
                </label>
              </li>
            );
          } else if (setting && typeof setting === 'object') {
            return (
              <SettingsRenderer
                key={setting.key}
                settingsConfiguration={setting}
                parserSettings={setting.settings(parserSettings)}
                onChange={
                  settings => onChange(
                    {...parserSettings, [setting.key]: settings},
                  )
                }
              />
            );
          }
        })}
      </ul>
    </div>
  );
}

SettingsRenderer.propTypes = {
  settingsConfiguration: PropTypes.object.isRequired,
  parserSettings: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
};
