import { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, ChangeEvent as ReactChangeEvent } from 'react';

export type DOMEvent =
  | MouseEvent
  | TouchEvent
  | KeyboardEvent
  | ReactKeyboardEvent<HTMLElement>
  | ReactMouseEvent<HTMLElement>
  | ReactTouchEvent<HTMLElement>
  | ReactChangeEvent<HTMLInputElement>;