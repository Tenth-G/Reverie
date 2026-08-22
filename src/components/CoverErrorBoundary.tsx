import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  onError?: (error: Error) => void;
  children: ReactNode;
}

/**
 * Keeps a WebGL failure from taking the whole app down.
 *
 * Without this, an exception thrown while setting up the particle cover
 * propagates out of the effect and React unmounts the entire root: the window
 * goes blank with no way back to the browse view.
 */
export default class CoverErrorBoundary extends Component<
  Props,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
