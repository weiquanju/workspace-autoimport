
/**
 *
 * @param {string} componentName
 * @returns
 */
function resolver(componentName: string) {
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