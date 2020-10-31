// import * as React from "react";
// import * as ReactDOM from "react-dom";

import React from "./react_2";
import ReactDOM from "./react_2/react-dom";
import "./index.css";

const updateValue = (e) => {
  rerender(e.target.value);
};

const container = document.getElementById("root");

const rerender = (value) => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
      {/* 这里可能是深度优先遍历, 所以在第一层找到 div.border, 第二层找到 h1, 第三层想找 "慢 慢 慢" 的时候就报错了(前提是我们还没有处理文本节点的时候) */}
      <h1>
        <div>1111</div>
        <p>11111 - 1</p>
      </h1>
      <p>node - 1</p>
      <a href="https://www.kaikeba.com/">node - 2</a>
    </div>
  );
  ReactDOM.render(element, container);
};

rerender("World");
