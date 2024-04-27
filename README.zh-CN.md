# 依赖和使用者

[English](./README.md) | 简体中文

在树视图中查看依赖和使用者。

![view](./images/view.webp)

## 功能

### 依赖和使用者树

分析依赖和使用者，并在树视图中展示。

### 锁定树

切换其他文件时，如果为锁定状态，树将不会改变。

## 配置

<img src="./images/settings.webp" alt="settings" width="550px" />

### 入口文件

`dependencyDependent.entryPoints` 配置从哪些文件开始寻找依赖。默认是：

```json
["src/**/*.{ts,js,tsx,jsx,vue}", "app/**/*.{ts,js,tsx,jsx,vue}"]
```

默认所有 `src` 和 `app` 文件夹中的 `ts,js,tsx,jsx,vue` 文件为入口文件。如果你的项目的入口文件不在默认配置中，可以自行添加。

### 忽略文件

`dependencyDependent.excludes` 配置忽略寻找依赖的条件，默认是：

```json
["node_modules"]
```

如果需要忽略其他文件，可以自行添加。如果希望寻找 `node_modules` 的依赖可以删掉 `node_modules` 这个条件。

## 配置 webpack

### 一、点击“配置 webpack”按钮

<img src="./images/config-webpack.webp" alt="config webpack" width="550px" />

### 二、修改拓展使用的 webpack 配置

你可以在 `.vscode/dependency-dependent-webpack-config.js` 文件中修改任意 [webpack 配置](https://webpack.js.org/configuration/)。

## Note

1.  有些依赖可能使用**特殊的配置**引入（例如：[webpack alias](https://webpack.js.org/configuration/resolve/#resolvealias)），这些依赖**默认无法收集到**，可以通过[配置 webpack](#配置-webpack)收集他们。

2.  由于更新可能会很慢。本拓展程序**不会自动更新**依赖数据，需要手动点击刷新按钮更新依赖数据。

## 通过命令行安装

```bash
code --install-extension zjffun.dependency-dependent
```

## [更新日志](./CHANGELOG.md)

## [贡献](./CONTRIBUTING.md)
