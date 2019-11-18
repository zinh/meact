function createTextElement(text){
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function createElement(type, props, ...children){
  return {
    type: type,
    props: {
      ...props,
      children: children.map(child => typeof child == 'object'
        ? child
        : createTextElement(child))
    }
  }
}

function createNode(element){
  if (element.type == "TEXT_ELEMENT") {
    return document.createTextNode(element.props.nodeValue);
  }

  const node = document.createElement(element.type);
  for (let propName in element.props){
    if (propName == 'children') {
      for (let child of element.props.children)
        node.appendChild(createNode(child))
    } else {
      node[propName] = element.props[propName];
    }
  }
  return node;
}

let nextUnitOfWork = null;

function workLoop(idleDeadline){
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield){
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = idleDeadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(nextUnitOfWork){
  // TODO
}

function render(element, container) {
  let node = element.type == 'TEXT_ELEMENT'
    ? document.createTextNode(element.props.nodeValue)
    : document.createElement(element.type);

  Object.keys(element.props)
    .filter(propName => propName != 'children')
    .forEach(propName => node[propName] = element.props[propName]);

  for (let child of element.props.children)
    render(child, node)
  container.append(node);
}

const Didact = { createElement, render };
