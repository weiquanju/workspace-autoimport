# Vue 组件库自动引入最佳实践

## 背景

笔者项目基于 monorepo 架构，以组织前端项目和内部公共组件库。monorepo 是使用的[pnpm workspace](https://pnpm.io/zh/pnpm-workspace_yaml)技术，极简配置即可使用，如下。

monorepo 仓库更目录创建`pnpm-workspace.yaml`

```yaml
packages:
  # all packages in direct subdirs of packages/
  - "packages/*"
  # all packages in subdirs of app/
  - "app/*"
  # exclude packages that are inside test directories
  - "!**/test/**"
```

在了解完了[pnpm workspace](https://pnpm.io/zh/pnpm-workspace_yaml)技术后，笔者现在的问题是，在`app/management`目录下的应用页面中，需要引入`packages/components`目录里的组件`button.vue`。

有人要问：那不是很简单吗？

是的，直接`import Button from 'components/button.vue'`就行了。好了，好了，文章到此结束。。。

停停停！

手动引入当然没有问题，问题是要自动引入啊，这样不是更爽吗，早点下班不香吗？

## 使用工作区的 npm 包

monorepo 仓库根目录下执行命令，还原笔者的工作区

```shell
mkdir app/management -p

# 创建应用management
cd app
# `Project Name`输入`management`
npm create vue@latest

# 进入management目录完成安装
cd management
pnpm install


cd ../../

# 创建npm包，components组件库
mkdir packages/components -p

cd packages/components

pnpm init

# 创建button组件
echo "<template>Button</template>" > button.vue

# 回到应用management中
cd ../../app/management

# 在应用management中添加components组件包
pnpm add components --workspace


echo "<template><WButton/></template>" > src/views/HomeView.vue

```

## 回归正题

笔者既要实现 button 组件的自动引入，同时还要实现编辑器对组件的属性的提示。

### components包支持es module

需要修改`packages/components/package.json`，添加`"type": "module",`

### 实现自动导入，提供 resolver

`auto-import.js`, 文件路径：`packages/components/auto-import.js`

```js
/**
 *
 * @param {string} componentName
 * @returns
 */
function resolver(componentName) {
  if (componentName.substring(0, 1).toLowerCase() !== "w") {
    return;
  }
  const map = new Map([["Button", "components/button.vue"]]);
  //下划线风格转为驼峰
  const name = componentName
    .replace(/-(\w)/g, (m, m1) => m1.toUpperCase())
    .slice(1);
  if (map.has(name)) {
    const from = map.get(name);
    if (from) return { from, name: "default"/*components/button.vue默认以default方式导出*/ };
  }
}

export default resolver;
```

注意：ts 项目需要添加`d.ts`文件，避免在 vite 中引入 resolver 报错：类型未定义

`auto-import.d.ts`, 文件路径：`packages/components/auto-import.d.ts`

```ts
export default function resolver(componentName: string):
  | {
      name: string;
      from: string;
    }
  | undefined;
```

### 声明组件类型

这里的声明是让组件在vscode中有会提示组件属性

`types.d.ts`, 文件路径：`packages/components/types.d.ts`

```ts
// GlobalComponents for Volar
declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    WButton: typeof import("./button.vue")["default"];
  }
}

export {};
```

## 验证

### 1. 安装vite自动导入插件`unplugin-vue-components`

在`app/management`目录下执行

```shell
pnpm add unplugin-vue-components -D
```

### 2. vite添加自动导入配置

修改文件`app/management/vite.config.ts`

```ts
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const resolver = await import('components/auto-import').then((res) => res.default)
  return {
    plugins: [
      Components({
        // globs: ['src/components/**/*.{vue}'],
        dts: './components.d.ts',
        types: [],
        resolvers: [resolver],
        exclude: [/[\\/]node_modules[\\/]/]
      }),
      vue(),
      vueJsx()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
```

### 3. 添加组件库ts类型

修改文件`app/management/env.d.ts`

```ts
/// <reference types="vite/client" />
/**
 * 引用组件库components里的类型声明
 */
/// <reference types="components/types" />
/**
 * unplugin-vue-components生成的组件类型声明
 */
/// <reference types="./components" />
```

### 测试

此时我们把`button.vue`组件修改一下

```vue
<template>
  {{ txt }}
</template>
<script setup lang='ts'>
defineProps<{txt: string}>()
</script>
```

修改文件`app/management/src/views/HomeView.vue`
```vue
<script setup lang="ts"></script>
<template><WButton txt="Hello Vue!"/></template>
```
启动项目

```shell
pnpm dev
```

我们在`src/views/HomeView.vue`可以看到`<WButton/>`组件标红，鼠标移上去显示`msg`属性为`string`类型

## 文章代码仓库

为了方便大家学习，已经将文章内容和代码全部提交到github

[workspace-autoimport](https://github.com/weiquanju/workspace-autoimport)