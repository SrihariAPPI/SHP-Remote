/**
 * High-performance haptic feedback utility for Android mobile browsers.
 * Uses navigator.vibrate() with carefully tuned micro-durations to provide
 * authentic tactile feedback without lagging touch or pointer input.
 */

export const triggerHaptic = (
  pattern: number | number[] = 10,
  enabled: boolean = true
) => {
  if (!enabled || typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch (err) {
    // Gracefully ignore if blocked by browser policy
  }
};

export const hapticFeedback = {
  // Ultra-light 8ms tick for virtual keyboard letters, space, arrows
  keyPress: (enabled = true) => triggerHaptic(8, enabled),

  // Crisp 12ms click for trackpad left/middle click
  trackpadClick: (enabled = true) => triggerHaptic(12, enabled),

  // Double pulse for double-click
  doubleClick: (enabled = true) => triggerHaptic([12, 35, 12], enabled),

  // Slightly heavier 20ms pulse for right-click / context menu
  rightClick: (enabled = true) => triggerHaptic(20, enabled),

  // Heavier 18ms pulse for Enter, Backspace, Esc, Delete
  actionKey: (enabled = true) => triggerHaptic(16, enabled),

  // Distinct pulse for modifier key latch (Ctrl, Alt, Shift, Win)
  modifierToggle: (isActive: boolean, enabled = true) =>
    triggerHaptic(isActive ? 16 : 8, enabled),

  // Subtle 6ms micro-tick for scroll steps and volume notches
  scrollTick: (enabled = true) => triggerHaptic(6, enabled),

  // Transport media buttons
  mediaButton: (enabled = true) => triggerHaptic(14, enabled),

  // Long press trigger (e.g. Remote Desktop right-click)
  longPress: (enabled = true) => triggerHaptic(28, enabled),

  // Light 10ms click for tab navigation and selection
  selection: (enabled = true) => triggerHaptic(10, enabled),
  tabSwitch: (enabled = true) => triggerHaptic(12, enabled),
};
