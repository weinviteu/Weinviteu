import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LiveFrame from '../src/components/LiveFrame';

const observers: Array<{ notify: (visible: boolean) => void }> = [];
beforeEach(() => {
  vi.useFakeTimers();
  observers.length = 0;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) {
      observers.push({ notify: visible => callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver) });
    }
    observe() {} disconnect() {}
  });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('animated storefront preview scheduling', () => {
  it('limits simultaneous previews and releases a slot for the next visible card', () => {
    const view = render(<>{[1, 2, 3].map(n => <LiveFrame key={n} title={`Preview ${n}`} src="about:blank" />)}</>);
    act(() => { observers.forEach(observer => observer.notify(true)); vi.advanceTimersByTime(180); });
    expect(view.container.querySelectorAll('iframe')).toHaveLength(2);
    act(() => { observers[0].notify(false); vi.advanceTimersByTime(600); });
    expect(view.container.querySelectorAll('iframe')).toHaveLength(2);
    expect(view.container.querySelector('iframe[title="Preview 1"]')).toBeNull();
    expect(view.container.querySelector('iframe[title="Preview 3"]')).not.toBeNull();
  });
  it('runs both hero devices on mobile while keeping posters visible during loading', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const view = render(<><LiveFrame hero poster="/cover.webp" title="Hero phone" src="about:blank" /><LiveFrame hero poster="/cover.webp" title="Hero laptop" src="about:blank" /></>);
    act(() => { observers.forEach(observer => observer.notify(true)); vi.advanceTimersByTime(180); });
    expect(view.container.querySelectorAll('iframe')).toHaveLength(2);
    expect(view.container.querySelectorAll('.live-frame-with-cover img')).toHaveLength(2);
  });
  it('does not reload a preview when a short scroll crosses its visibility boundary', () => {
    const view = render(<LiveFrame title="Stable preview" src="about:blank" />);
    act(() => { observers[0].notify(true); vi.advanceTimersByTime(180); });
    const frame = view.container.querySelector('iframe');
    act(() => { observers[0].notify(false); vi.advanceTimersByTime(300); observers[0].notify(true); vi.advanceTimersByTime(180); });
    expect(view.container.querySelector('iframe')).toBe(frame);
  });
  it('does not start previews during a fast scroll past a card', () => {
    const view = render(<LiveFrame title="Passed preview" src="about:blank" />);
    act(() => { observers[0].notify(true); vi.advanceTimersByTime(100); observers[0].notify(false); vi.advanceTimersByTime(600); });
    expect(view.container.querySelector('iframe')).toBeNull();
  });
});
