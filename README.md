# Dependency & Dependent

English | [简体中文](./README.zh-CN.md)

**Note1: Some dependencies may be imported according special configurations (for example: [webpack alias](https://webpack.js.org/configuration/resolve/#resolvealias)), these dependencies can't be collected by default, you can [config webpack](#config-webpack) to collect them.**

**Note 2: This extension will not automatically update the dependency data, you need to manually click the refresh button to update the dependency data.**

Show dependencies and dependents (references).

![view](./images/view.webp)

## Settings

<img src="./images/settings.webp" alt="settings" width="550px" />

### Entry Points

`dependencyDependent.entryPoints` config entry points to find dependencies and dependents. Default:

```json
[
  "src/**/*.{ts,js,tsx,jsx,vue}"  
]
```

By default, all `ts,js,tsx,jsx,vue` files in `src` will as entry points. If the entry points of your project are not in the default setting, you can add them.

### Excludes

`dependencyDependent.excludes` config finding dependencies in these conditions. Default:

```json
["node_modules"]
```

If you need to excludes other files, you can add them. If you want to find the dependencies and dependents of `node_modules`, you can delete the `node_modules` in the `dependencyDependent.excludes`.

## Config webpack

### 1. Click the “Config webpack” button

<img src="./images/config-webpack.webp" alt="config webpack" width="550px" />

### 2. Modify the webpack configuration for this extension

You can modify any [webpack configuration](https://webpack.js.org/configuration/) in `.vscode/dependency-dependent-webpack-config.js`.

## Install via CLI

```bash
code --install-extension zjffun.dependency-dependent
```

## [Release Notes](./CHANGELOG.md)

## [Contribute](./CONTRIBUTING.md)
