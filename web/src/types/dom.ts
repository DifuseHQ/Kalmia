import {
  ChangeEvent as ReactChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";

export type DOMEvent =
  | MouseEvent
  | TouchEvent
  | KeyboardEvent
  | ReactKeyboardEvent<HTMLElement>
  | ReactMouseEvent<HTMLElement>
  | ReactTouchEvent<HTMLElement>
  | ReactChangeEvent<HTMLInputElement>;
