
/**
 * Lab 02 - Exercise 1
 * Task 1.1: VNode and Props Contracts
 *
 * Defines the data structure of the custom Virtual DOM.
 * No runtime implementation is included.
 */

// An element can be a native HTML tag or a function component.
export type VNodeType =
  | string
  | ((props: VNodeProps) => VNode);

// Properties associated with a Virtual DOM node.
export interface VNodeProps {
  [key: string]: unknown;
  children: VNode[];
  nodeValue?: string;
}

// A lightweight representation of a DOM node.
export interface VNode {
  readonly type: VNodeType;
  readonly props: Readonly<VNodeProps>;
}
