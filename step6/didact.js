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

const isProperty = (propertyName) => propertyName !== 'children' && !isEvent(propertyName)
const isGone = (prevProps, nextProps) => key => !(key in nextProps)
const isNew = (prevProps, nextProps) => key => key in nextProps
const isEvent = key => key.startsWith('on');

function createDom(fiber){
  if (fiber.type == 'TEXT_ELEMENT')
    return document.createTextNode(fiber.props.nodeValue)

  const dom = document.createElement(fiber.type)

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(propName => dom[propName] = fiber.props[propName])

  return dom
}


function updateDom(dom, prevProps, nextProps){
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(propName => dom[propName] = "")

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(propName => dom[propName] = nextProps[propName])

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isGone(prevProps, nextProps))
    .forEach(propName => {
      let eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[propName]);
    })

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(propName => {
      let eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[propName]);
    })
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber)
    return;

  const domParent = fiber.parent.dom;

  if (
    fiber.effectTag == 'PLACEMENT' && 
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag == 'DELETION') {
    domParent.removeChild(fiber.dom);
  } else if (
    fiber.effectTag == 'UPDATE' &&
    fiber.dom != null
  ) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }
  domParent.appendChild(fiber.dom);

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = [];

function workLoop(idleDeadline){
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield){
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = idleDeadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(wipRoot);
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber){
  // add DOM node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // create new fiber
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

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

function reconcileChildren(wipFiber, elements){
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && oldFiber.type == element.type

    if (sameType) { // element updated
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      }
    } 

    if (element && !sameType) { // element created
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      }
    } 

    if (oldFiber && !sameType) { // element deleted
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
  }
}

const Didact = { createElement, render };
