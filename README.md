# React 源码学习 之 react_1 文件夹

这里是源码实现开始的第一步, 先是在 render 函数里实现了渲染, 如下:

```js
function render(vnode, container) {
  // 创建 dom
  const node = vnodeToNode(vnode);
  // 向容器中添加 dom
  container.appendChild(node);
}
```

到上面那一步还没有使用 fiber 架构, 只是通过不断 appendChild 的方式, 通过协调函数 reconcileChildren 来不断 render, 来实现渲染到页面, 到这一步实现了原生标签, 包括 fragment, 以及函数组件, 类组件的实现

然后在下一步使用 fiber 架构, render 函数也变成了如下:

```js
function render(vnode, container) {
  wipRoot = {
    stateNode: container,
    props: {
      children: [vnode],
    },
  };
  nextUnitOfWork = wipRoot;
}
```

使用 fiber 架构并没有实现对函数组件, fragment 节点, 类组件的支持, 但是通过对 fiber 架构的简单实现, 可以初步了解到 fiber 架构

到目前为止, react_1 文件夹里就做了这么多, 下一步是使用 fiber 架构, 支持初次渲染, 以及渲染更新, 这些可以再 update_fiber 分支下看到, 在 update_fiber 分支下, 实现了初次渲染, 渲染更新, 以及对函数组件的支持, 另外还简单实现了 useState Hook
