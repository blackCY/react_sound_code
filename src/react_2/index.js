// * 创建 vnode
function createElement(type, config, ...children) {
  if (config) {
    delete config.__self;
    delete config.__source;
  }

  const props = {
    ...config,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextElement(child)
    ),
  };

  // * 注意返回值
  return {
    type,
    props,
  };
}

// * 处理文本节点
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      children: [],
      nodeValue: text,
    },
  };
}

export default {
  createElement,
};
