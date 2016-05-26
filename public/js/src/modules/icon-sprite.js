import svg4everybody from 'svg4everybody';

const SUCCESS_CLASS = 'icons-loaded';

const renderIconSprite = svg => {
    const container = document.createElement('div');
    container.classList.add('is-offscreen');
    container.innerHTML = svg;

    document.body.appendChild(container);
    document.documentElement.classList.add(SUCCESS_CLASS);
    svg4everybody();
};

export default () => {
  // If there are no svg icons on the current page, there
  // is no need to load the sprite
  if (!document.querySelector('svg')) {
    return;
  }

  const req = new XMLHttpRequest();
  /* eslint-disable func-names */
  req.addEventListener('load', function() {
    renderIconSprite(this.response);
  });

  req.open("get", ICON_SPRITE, true);
  req.send();
};
