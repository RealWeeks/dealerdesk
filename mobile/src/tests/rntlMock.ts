import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

let container: HTMLDivElement;

export function render(element: React.ReactElement) {
  container?.remove();
  container = document.createElement("div");
  document.body.appendChild(container);
  flushSync(() => createRoot(container).render(element));
  return screen;
}

function allElements() {
  return Array.from(container.querySelectorAll("*"));
}

function matchText(element: Element, matcher: string | RegExp) {
  const text = element.textContent ?? "";
  return typeof matcher === "string" ? text === matcher : matcher.test(text);
}

function matchingElements(matcher: string | RegExp) {
  return allElements()
    .filter((element) => matchText(element, matcher))
    .filter((element) => !Array.from(element.children).some((child) => matchText(child, matcher)));
}

export const screen = {
  getByText(matcher: string | RegExp) {
    const found = matchingElements(matcher)[0];
    if (!found) throw new Error(`Unable to find text ${String(matcher)}`);
    return found;
  },
  getAllByText(matcher: string | RegExp) {
    const found = matchingElements(matcher);
    if (!found.length) throw new Error(`Unable to find text ${String(matcher)}`);
    return found;
  },
  getByLabelText(label: string) {
    const found = container.querySelector(`[aria-label="${label}"]`);
    if (!found) throw new Error(`Unable to find label ${label}`);
    return found;
  },
  getByDisplayValue(value: string) {
    const found = allElements().find((element) => "value" in element && (element as HTMLInputElement).value === value);
    if (!found) throw new Error(`Unable to find display value ${value}`);
    return found;
  }
};

export const fireEvent = {
  press(element: Element) {
    const target = element.closest("button") ?? element;
    if ("click" in target) (target as HTMLElement).click();
    else target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  },
  changeText(element: Element, value: string) {
    const descriptor = Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value");
    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
};
