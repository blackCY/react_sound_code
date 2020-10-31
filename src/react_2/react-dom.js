// * 将创建好的 vnode 传入 render 函数将其添加到 node
function render(element, container) {
  // * 将创建 DOM 节点的部分保留在其自身的功能中, 这是因为当开始渲染我们就要初始化 root fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // ! 旧 fiber, 是上一次提交阶段提交给 dom 的 fiber
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

// * 马上要执行的一个工作单元
let nextUnitOfWork = null;
// * 进行中的(work in progress) root
let wipRoot = null;
// ! 提交给 dom 的最后一个 fiber 的引用
let currentRoot = null;
// ! 跟踪删除的节点, 将其推入数组中
let deletions = null;

// * vnode -> node
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // ! 这里是第一次创建元素的时候添加对应的属性
  updateDom(dom, {}, fiber.props);

  return dom;
}

// ! 我们需要更新的一种特殊 props 是事件侦听器, 因此, 如果 props 名称以 on 开头, 我们将以不同的方式处理他们
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // ! 如果事件处理程序发生更改, 我们将从节点中将其删除
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // ! 删除旧的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // ! 更新新的属性, 包括第一次的属性更新
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // ! 添加新的事件处理程序
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

// * 子节点协调函数
function reconcileChildren(wipFiber, elements) {
  let index = 0,
    prevSibling = null,
    len = elements.length;
  // ! 拿到每次 fiber 的旧 fiber
  // ! 这里的 oldFiber 有两次是 null, 第一次渲染和第一次更新
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  // ! 这里进行判断, 有子节点的才能进来, 即如果是空数组, 就进不来
  while (index < len || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    // * 如果旧的 fiber 和新的元素具有相同的类型, 我们可以保留 DOM 节点仅仅使用新的 props 进行更新
    if (sameType) {
      // * update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    // * 如果类型不同并且有一个新元素, 则意味着我们需要创建一个新的 DOM 节点
    // ! 也是为第一次渲染时创建
    if (element && !sameType) {
      // * add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    // * 如果类型不同且有旧 fiber, 我们需要删除旧 fiber
    if (oldFiber && !sameType) {
      // * delete the oldFiber's node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    // ! 由于将 fiber 提交给 DOM 时, 我们是从正在进行的 work in progress of root, 即 wipRoot 开始的,该 root 没有 oldFiber, 所以我们要进行判断
    // ! 每一次进到这里来是替换当前 oldFiber, 将 oldFiber 赋值给当前 element 的下一个兄弟节点
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // * performUnitOfWork 不仅要处理当前工作单元并且还需要返回下一个待处理的工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

// * 在 commitRoot 中将所有节点递归添加到真实 dom
function commitRoot() {
  // ? 然后, 当我们将更改提交给 DOM 时, 我们还使用该阵列中的 fiber
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  // ! 上一次提交的整个(根) fiber 树, 即旧的 fiber
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    // * 如果是 DELETION, 则我们删除该子节点
    domParent.removeChild(fiber.dom);
  } else {
    // ! 如果没有 dom 节点, 则我们递归函数, 找函数组件的返回值子节点
    commitDeletion(fiber.child, domParent);
  }
}

function commitWork(fiber) {
  if (!fiber) return;

  let domParentFiber = fiber.parent;
  // ! 由于函数组件的 fiber 没有 DOM 节点, 所以我们向函数组件的父节点拿, 在删除节点时, 也是如此
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;

  // ! 更改此函数以处理 new effectTags
  // * 如果该 fiber 具有 PLACEMENT 标签, 则与之相同, 将 DOM 节点附加到父 fiber 节点上
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    // * 如果是 UPDATE, 我们需要使用更改后的 props 更新现有的 DOM 节点
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * * 在这里面处理 Fiber 的结构
 *
 * @param {fiber} nextUnitOfWork
 */
function performUnitOfWork(fiber) {
  // * 判断是函数组件还是原生标签组件
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // * 3 返回下一个要处理的 fiber
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

// * 引用 rootFiber
let wipFiber = null;
// * 跟踪当前的 hook 索引
let hookIndex = null;

// * useState Hook
function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // ! 如果我们有一个 old_hook, 则将 state 从 old_hook 复制到新的 hook, 否则, 初始化 state, 即 useState 入参
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    if (typeof action === "function") {
      hook.state = action(hook.state);
    } else {
      hook.state = action;
    }
  });

  const setState = (action) => {
    hook.queue.push(action);
    // ! 更新 wipRoot, nextUnitOfWork 以及将 deletions置为空数组
    // ! 以便工作循环可以进入新的渲染阶段
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

// * 函数组件
// ! 函数组件有两大不同: 1. 函数组件的 fiber 没有 DOM 节点, 2. 函数组件的 children 来自函数执行
function updateFunctionComponent(fiber) {
  // ! 初始化全局变量, 以便可以在 useState 内部使用他们
  wipFiber = fiber;
  hookIndex = 0;
  // * 添加数组, 以便在同一组件中可以多次调用 useState
  wipFiber.hooks = [];

  // ! 函数组件的标签是通过接收执行函数的返回值, 需要将 props 作为参数传入
  // ! 但要注意的是, 我们还需要处理 fiber 没有 DOM 的情况, 在 commitWork 里处理
  const children = [fiber.type(fiber.props)];

  reconcileChildren(fiber, children);
}

// * 原生标签节点组件
function updateHostComponent(fiber) {
  // * 1 将元素添加到 DOM
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // * 2 协调子节点
  reconcileChildren(fiber, fiber.props.children);
}

export default {
  render,
  useState,
};
