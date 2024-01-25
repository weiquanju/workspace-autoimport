# Vue 组件库自动引入最佳实践

## 前言

你是否好奇`ElementPlusResolver`如何实现自动导入的？今天来解密element-plus组件自动导入如何实现的。如果你是组件库作者，那一定不容错过。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  // ...
  plugins: [
    // ...
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
});
```

## 背景

笔者项目基于 monorepo 架构，以组织前端项目和内部公共组件库。monorepo 是使用的[pnpm workspace][pnpm-workspace]技术，极简配置即可使用，如下。

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

在了解完了[pnpm workspace][pnpm-workspace]技术后，现在的问题是，在`app/management`目录下的应用页面中，需要引入`packages/components`目录里的组件`button.vue`。

有人要问：那不是很简单吗？

是的，直接`import Button from 'components/button.vue'`就行了。

好了，好了，文章到此结束。。。

停停停！

手动引入当然没有问题，问题是要自动引入啊，这样不是更爽吗，早点下班不香吗？

## 创建项目工作区，使用内部 npm 包

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

下面开始演示[HomeView.vue][HomeView.vue]中`<WButton/>`不使用import语法实现自动按需导入components包里面的button组件。

## 回归正题，自动引入的实现过程

笔者既要实现 button 组件的自动引入，同时还要实现编辑器vscode对组件的属性的提示。

### 1. components包支持es module

需要修改[packages/components/package.json][package.json]，添加`"type": "module",`

### 2. 实现自动导入，提供 resolver

`auto-import.mjs`, 文件路径：[packages/components/auto-import.mjs][auto-import.mjs]

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
    if (from)
      return {
        from,
        name: "default" /*components/button.vue默认以default方式导出*/,
      };
  }
}

export default resolver;
```

注意：ts 项目需要添加`d.ts`文件，避免在 vite 中引入 resolver 报错：类型未定义

`auto-import.d.ts`, 文件路径：[packages/components/auto-import.d.ts][auto-import.d.ts]

```ts
export default function resolver(componentName: string):
  | {
      name: string;
      from: string;
    }
  | undefined;
```

## 验证

### 1. 安装vite自动导入插件[unplugin-vue-components][unplugin-vue-components]

在`app/management`目录下执行

```shell
pnpm add unplugin-vue-components -D
```

### 2. vite添加自动导入配置

修改文件[app/management/vite.config.ts][vite.config.ts]

```ts
import { defineConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import ComponentsResolver from "components/auto-import";

// https://vitejs.dev/config/
export default defineConfig({
  //...
  plugins: [
    Components({
      dts: "./components.d.ts",
      types: [],
      resolvers: [ComponentsResolver],
      exclude: [/[\\/]node_modules[\\/]/],
    }),
    //...
  ],
});
```

### 3. [**关键**]添加组件库ts类型 

修改文件[app/management/env.d.ts][env.d.ts]

```ts
/// <reference types="vite/client" />
/**
 * !**非常关键** unplugin-vue-components生成的组件类型声明
 */
/// <reference types="./components" />
```

这一步会让vscode获得组件参数的自动提示

### 4. 测试

此时我们把[button.vue][button.vue]组件修改一下

```vue
<template>
  {{ txt }}
</template>
<script setup lang="ts">
defineProps<{ txt: string }>();
</script>
```

修改文件[HomeView.vue][HomeView.vue]

```vue
<script setup lang="ts"></script>
<template><WButton txt="Hello Vue!" /></template>
```

启动项目

```shell
pnpm dev
```

我们在[HomeView.vue][HomeView.vue]可以看到`<WButton/>`组件标红，鼠标移上去显示`msg`属性为`string`类型

## 总结

文章主要介绍了如何实现npm包组件库的resolver实现组件自动、按需加载，同时实现编辑器自动提示包内组件的属性。如果有些技术要点不清楚，建议根据自己需要进一步了解下面这些技术要点。

### 技术要点

- [pnpm workspace][pnpm-workspace]
- [create vue][create-vue]
- [vite config][vite-config]
- [unplugin-vue-components][unplugin-vue-components]

### 文章的代码仓库

为了方便大家学习，已经将文章内容和代码全部提交到github

[workspace-autoimport][repo]

感谢你的阅读！

[package.json]: https://github.com/weiquanju/workspace-autoimport/blob/main/packages/components/package.json
[auto-import.mjs]: https://github.com/weiquanju/workspace-autoimport/blob/main/packages/components/auto-import.mjs
[auto-import.d.ts]: https://github.com/weiquanju/workspace-autoimport/blob/main/packages/components/auto-import.d.ts
[button.vue]: https://github.com/weiquanju/workspace-autoimport/blob/main/packages/components/button.vue
[vite.config.ts]: https://github.com/weiquanju/workspace-autoimport/blob/main/app/management/vite.config.ts
[env.d.ts]: https://github.com/weiquanju/workspace-autoimport/blob/main/app/management/env.d.ts
[HomeView.vue]: https://github.com/weiquanju/workspace-autoimport/blob/main/app/management/src/views/HomeView.vue
[pnpm-workspace]: https://pnpm.io/zh/pnpm-workspace_yaml
[create-vue]: https://github.com/vuejs/create-vue
[vite-config]: https://vitejs.dev/config/
[unplugin-vue-components]: https://github.com/unplugin/unplugin-vue-components
[repo]: https://github.com/weiquanju/workspace-autoimport
