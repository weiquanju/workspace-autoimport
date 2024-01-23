// GlobalComponents for Volar
declare module "@vue/runtime-core" {
    export interface GlobalComponents {
      WButton: typeof import("./button.vue")["default"];
    }
  }
  
  export {};