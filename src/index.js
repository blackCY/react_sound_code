// import * as React from "react";
// import * as ReactDOM from "react-dom";

import React from "./react_1";
import ReactDOM from "./react_1/react-dom";
import "./index.css";
import Component from "./react_1/Component";

// * 函数组件并没有真实的 dom 节点
// * 函数组件的返回值 jsx 是函数组件的子节点, 这一点可以从 Fiber 的结构里看到
function FunctionComponent(props) {
  return <div className="fun">FunctionComponent-{props.name}</div>;
}

function NNode() {
  return (
    <>
      <li>fragment-node-1</li>
      <li>fragment-node-2</li>
      <li>fragment-node-3</li>
    </>
  );
}

// STEP 10 在类组件里接受传递下来的值, 我们还需要在 Component 组件里接受, 因为类组件都继承自 Component
class ClassComponent extends Component {
  // STEP 11 使用默认属性, 由于静态属性在类下面, 所以在 createElement 函数执行的时候静态属性就在 type 下面
  static defaultProps = {
    color: "pink",
  };
  render() {
    return <div className={this.props.color}>类组件 -- {this.props.name}</div>;
  }
}

const jsx = (
  <div className="border">
    <h1>
      <div>1111</div>
      <p>11111 - 1</p>
    </h1>
    <p>node - 1</p>
    <a href="https://www.kaikeba.com/">node - 2</a>
    {/* <FunctionComponent name="函数组件" /> */}
    {/* <ul>
      <NNode />
    </ul> */}
    {/* <ClassComponent name="class component" /> */}
  </div>
);

ReactDOM.render(jsx, document.getElementById("root"));
