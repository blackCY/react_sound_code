// STEP 1 创建虚拟 dom
function createElement(type, config, ...children) {
  // ! 我们这里将 __self 和 __source 删除, 源码里没有删除
  if (config) {
    delete config.__self;
    delete config.__source;
  }

  const props = {
    // STEP 11 使用类的默认静态属性, 注意这里 config 的优先级高
    ...((type && type.defaultProps) || {}),
    ...config,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextNode(child)
    ),
  };

  return {
    type,
    props,
  };
}

// STEP 4 将 文本节点转换 vnode 形式
function createTextNode(text) {
  return {
    type: "TEXT", //* 手动指定文本节点类型, 便于区分
    props: {
      children: [],
      nodeValue: text,
    },
  };
}

export default { createElement };
