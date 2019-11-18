"use strict";

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

function createDom(fiber){
  if (fiber.type == 'TEXT_ELEMENT')
    return document.createTextNode(fiber.props.nodeValue)

  const dom = document.createElement(fiber.type)
  const isProperty = (propertyName) => propertyName !== 'children'

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(propName => dom[propName] = fiber.props[propName])

  return dom
}

function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element]
    }
  }
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

function performUnitOfWork(fiber){
  // add DOM node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent){
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // create new fiber
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;
  for (let index = 0; index < elements.length; index++){
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      dom: null,
      parent: fiber
    }

    if (index == 0)
      fiber.child = newFiber;
    else
      prevSibling.sibling = newFiber;

    prevSibling = newFiber;
  }

  // return next unit of work
  if (fiber.child)
    return fiber.child
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling)
      return nextFiber.sibling
    nextFiber = nextFiber.parent
  }
}

const Didact = { createElement, render };
