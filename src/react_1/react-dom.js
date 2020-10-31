// STEP 2 将创建好的虚拟对象使用 render 传入执行, 将其渲染
function render(vnode, container) {
  // * root fiber
  wipRoot = {
    stateNode: container,
    props: {
      children: [vnode],
    },
  };
  nextUnitOfWork = wipRoot;
}

function createNode(vnode, parentNode) {
  let node = null;
  const { type, props } = vnode;

  // STEP 5 判断节点类型, 然后生成真实 dom, 并将其返回
  if (type === "TEXT") {
    // 创建文本节点
    node = document.createTextNode("");
  } else if (typeof type === "string") {
    // 标签节点
    // * 根据标签节点的类型生成对应的标签节点
    node = document.createElement(type);
  } else if (typeof type === "function") {
    // * 由于类组件的本质还是函数组件, 所以我们需要判断, 使用函数上的 prototype.isReactComponent, 这是 React 源码里判断类组件和函数组件的方式
    if (type.prototype.isReactComponent) {
      // STEP 10 如果是类组件
      node = updateClassComponent(vnode, parentNode);
    } else {
      // STEP 8 如果是函数组件
      node = updateFunctionComponent(vnode, parentNode);
    }
  } /*  else if (type === undefined) {
    // STEP 9 如果是 Fragment 节点
    // node = document.createDocumentFragment();
  } */

  /**
   * * 在 React 里 Fragment 标签节点并没有使用创建文档碎片的方式, 而是将 Fragment 的子节点提取出来, 然后将其添加到 Fragment 的父节点上, 这样做的好处是减少了一次 dom 操作, 因为创建文档碎片也是一次 dom 操作, 而 React 中使用的这种方式只是做了将原来生成到父节点上的虚拟 dom 操作转移到了在爷爷节点上生成, 而直接减少了生成文档碎片的一次 dom 操作
   */
  // STEP 9 如果是 Fragment 节点
  if (type === undefined) {
    reconcileChildren(parentNode, props.children);
  } else {
    // STEP 6 做遍历: 上面只是生成最外层的真实 dom, 需要继续遍历, 生成子 node
    reconcileChildren(node, props.children);

    // STEP 7 更新节点属性: 第六步是将子节点插入到父节点, 我们还需要将子节点对应的属性加上去
    updateNode(node, props);

    return node;
  }
}

// * 协调子节点
/* function reconcileChildren(node, children) {
  // * node 是父节点
  for (let i = 0, len = children.length; i < len; i++) {
    // * 递归
    render(children[i], node);
  }
} */

// * 更新节点属性
function updateNode(node, props) {
  Object.keys(props)
    // * 这里需要将 children 过滤掉
    .filter((child) => child !== "children")
    .forEach((key) => {
      node[key] = props[key];
    });
}

// * 函数组件
function updateFunctionComponent(vnode, parentNode) {
  const { type, props } = vnode;

  // * 对于函数组件, 我们执行 type(type 即当前函数组件) 并将 props 传递进去, 得到返回的 jsx 处理过的 vnode
  const vvnode = type(props);

  // * 然后生成 node, 注意这里并没有父节点, 只是生成 node 即可
  const node = createNode(vvnode, parentNode);

  // * 然后返回这个 node
  return node;
}

// * 类组件
function updateClassComponent(vnode, parentNode) {
  const { type, props } = vnode;

  // * 对于类组件, 我们实例化 type(type 即当前类) 并将 props 传递进去, 得到类的实例, 实例里包括 render 方法
  const instance = new type(props);
  // * 我们需要执行 render 方法, 得到返回值 jsx 处理过的 vnode
  const vvnode = instance.render();

  // * 然后生成 node, 注意这里也是并没有父节点, 只是生成 node 即可
  const node = createNode(vvnode, parentNode);

  // * 然后返回这个 node
  return node;
}

// * 下一个要工作的 fiber
let nextUnitOfWork = null;

// * work in progress 正在工作中的
// * 正在工作中的 fiber root, 即 root 根节点
let wipRoot = null;

// * 新的子节点协调函数
function reconcileChildren(workInProgress, children) {
  let previousNewFiber = null;
  // * workInProgress 是父节点
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    let newFiber = {
      type: child.type,
      key: child.key,
      props: child.props,
      stateNode: null,
      child: null,
      sibling: null,
      return: workInProgress,
    };

    if (i === 0) {
      workInProgress.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  }
}

// TODO 更新
function updateHostComponent(workInProgress) {
  if (!workInProgress.stateNode) {
    const stateNode = createNode(workInProgress);
    workInProgress.stateNode = stateNode;
  }

  // * 协调子节点
  reconcileChildren(workInProgress, workInProgress.props.children);
}

// * 接收一个 fiber
function performUnitOfWork(workInProgress) {
  // * 1 处理当前 fiber
  updateHostComponent(workInProgress);

  // * 2 返回下一个要处理的 fiber
  if (workInProgress.child) {
    return workInProgress.child;
  }

  let next = workInProgress;
  while (next) {
    if (next.sibling) {
      return next.sibling;
    }
    // * 往父 fiber 上找该子节点的兄弟 fiber
    next = next.return;
  }
}

// * 更新 fiber
function workLoop(idleDeadline) {
  // * 这里假设当浏览器的空闲时间剩余 1ms 的时候, 就去处理
  while (nextUnitOfWork && idleDeadline.timeRemaining() > 1) {
    // * 处理当前 fiber, 并且返回下一个要处理的 fiber
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  // * 如果 nextUnitOfWork 有值, 说明当前 Fiber 结构并不完整, 则继续在下一次空闲时间内继续执行
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop);
  }

  if (!nextUnitOfWork && wipRoot) {
    // * 提交, vnode >> node, 更新到 container 中
    commitRoot();
  }
}

// STEP 12 使用 requestIdleCallback 的并发模式
// * 原来的递归调用存在问题, 一旦渲染开始, 就不会停止, 直到我们渲染了完整的元素树. 如果元素树很大, 则可能会阻塞主线程太长时间. 而且, 如果浏览器需要执行诸如处理用户输入或使动画保持平滑等优先级高的工作, 则它必须等待渲染完成
// * 因此, 我们把工作分解成几个小单元, 在完成每个单元之后, 如果需要执行其他任何操作, 我们将让浏览器中断渲染.
// * Fiber 结构的目标之一就是使查找下一个工作单元变得容易, 这就是为什么每个 Fiber 都链接到其第一个子节点, 下一个兄弟节点和父节点
requestIdleCallback(workLoop);

function commitRoot() {
  // * 根 root 不用提交, 所以从 child 开始
  commitWorker(wipRoot.child);
  wipRoot = null;
}

function commitWorker(workInProgress) {
  if (!workInProgress) return;

  let parentNodeFiber = workInProgress.return;
  let parentNode = parentNodeFiber.stateNode;

  if (workInProgress.stateNode) {
    parentNode.appendChild(workInProgress.stateNode);
  }

  // * 递归
  commitWorker(workInProgress.child);
  commitWorker(workInProgress.sibling);
}

export default { render };
