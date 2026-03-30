import PropTypes from 'prop-types';
import React from 'react';
import type { SettingsConfiguration } from '../../types';

const identity: (v: string) => string | number = v => v;

function valuesFromArray(settings: string[]) {
  return settings.reduce(
    (obj: Record<string, unknown>, name: string) => (
      (obj[name] = settings.indexOf(name) > -1),
      obj
    ),
    ({} as Record<string, unknown>),
  );
}

function getValuesFromSettings(settings: string[] | Record<string, unknown>) {
  if (Array.isArray(settings)) {
    return valuesFromArray(settings);
  }
  return settings;
}

type SettingsUpdater = (settings: Record<string, unknown>, name: string, value: unknown) => Record<string, unknown>;

function defaultUpdater(settings: Record<string, unknown>, name: string, value: unknown) {
  return {...settings, [name]: value};
}

function arrayUpdater(settings: Record<string, unknown>, name: string, value: unknown) {
  let settingsSet = (new Set(((settings as unknown) as Iterable<string>)) as Set<string>);
  if (value) {
    settingsSet.add(name);
  } else {
    settingsSet.delete(name);
  }
  return ((Array.from(settingsSet) as unknown) as Record<string, unknown>);
}

/** @returns {SettingsUpdater} */
function getUpdateStrategy(settings: string[] | Record<string, unknown>) {
  if (Array.isArray(settings)) {
    return arrayUpdater;
  }
  return defaultUpdater;
}

export default function SettingsRenderer(props: any): React.ReactElement {
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
        {fields.map((setting: any) => {
          if (typeof setting === 'string') {
            return (
              <li key={setting}>
                <label>
                  <input
                    type="checkbox"
                    readOnly={required.has(setting)}
                    disabled={required.has(setting)}
                    checked={(values[setting] as boolean)}
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
                    value={(values[fieldName] as string | number | readonly string[])}>
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
                  (settings: any) => onChange(
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
