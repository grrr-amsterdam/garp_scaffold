export const enhancer = elm => {
  const img = document.createElement('img');
  img.src = elm.getAttribute('data-url');
  elm.appendChild(img);
};
