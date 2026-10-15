// The page holds still while a reading panel or a minigame is open: the
// document stops scrolling (wheel, keys and touch drags alike) and keeps its
// place. Only elements marked [data-scroll-own] keep their own scrolling.
// Several holders can share the lock; the page moves again when the last
// one lets go.
const holders = new Set();
let saved = 0;

function holdTouch(event) {
  if (!holders.size || event.target.closest?.("[data-scroll-own]")) return;
  event.preventDefault();
}

export function lockPage(holder) {
  if (holders.has(holder)) return;
  if (!holders.size) {
    saved = scrollY;
    document.documentElement.classList.add("is-page-locked");
    addEventListener("touchmove", holdTouch, { passive: false });
  }
  holders.add(holder);
}

// `restore` puts the page back exactly where it was; a holder that moves
// the page itself afterwards (a minigame returning to the hero) skips it.
export function unlockPage(holder, restore = true) {
  if (!holders.delete(holder) || holders.size) return;
  document.documentElement.classList.remove("is-page-locked");
  removeEventListener("touchmove", holdTouch);
  if (restore && Math.abs(scrollY - saved) > 1) scrollTo(0, saved);
}

export const pageLocked = () => holders.size > 0;
