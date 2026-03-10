export const eventAfterAppRender = () => {
  // Preserve focus state on render
  if (
    document.activeElement &&
    !document.activeElement.isEqualNode(globalThis.activeElement)
  ) {
    if (globalThis.activeElement) {
      const { id } = globalThis.activeElement;

      if (id) {
        const elementToFocus = document.getElementById(id);

        if (elementToFocus) {
          elementToFocus.focus();
        }
      }
    }
  }

  const darkmodeButtonElement = document.querySelector('.ph.darkmode-button');
  const htmlElement = document.querySelector('html');

  if (darkmodeButtonElement && htmlElement) {
    darkmodeButtonElement.addEventListener('click', () => {
      if (htmlElement.classList.contains('theme--light')) {
        htmlElement.classList.remove('theme--light');
        localStorage.setItem('prefers-color-scheme', 'dark');
      } else {
        htmlElement.classList.add('theme--light');
        localStorage.setItem('prefers-color-scheme', 'light');
      }
    });
  }
};
