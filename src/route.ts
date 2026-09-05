import './style.css';

const heading = document.querySelector<HTMLElement>('[data-route-heading]');
const status = document.querySelector<HTMLElement>('#route-status');

if (heading) {
  window.requestAnimationFrame(() => {
    heading.focus({ preventScroll: true });
    if (status) status.textContent = `${heading.textContent?.trim() ?? 'Page'} loaded.`;
  });
}
