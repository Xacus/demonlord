class Tipfy {
  constructor(tag) {
    document.addEventListener('mouseover', e => {
      this.tag = e.target
      document.querySelectorAll(tag).forEach(item => {
        const _title = item.dataset.tipfy || item.title

        item.dataset.tipfy = _title
        if (item.title) {
          item.setAttribute('aria-label', item.title)
          item.removeAttribute('title')
        }
      })
      this.remove()
      if (this.tag.hasAttribute('data-tipfy')) {
        this.build()
        this.tag.addEventListener('mouseout', e => this.remove())
      }
    })
  }

  build() {
    const _tip = this.tag.dataset.tipfy
    let _html

    try {
      _html = this.tag.hasAttribute('data-tipfy-text') ? _tip : document.querySelector(_tip).outerHTML
    } catch (e) {
      _html = _tip
    }
    _html = _html.replace(/<script/g, '&lt;script').replace(/<\/script/g, '&lt;/script')
    document.body.insertAdjacentHTML('beforeend', `<div class="tipfy" role="tooltip">${_html}</div>`)
    if (this.tag.hasAttribute('data-tipfy-class')) {
      document.querySelector('.tipfy').classList.add(this.tag.dataset.tipfyClass)
    }
    this.side()
  }

  side() {
    const _tipfy = document.querySelector('.tipfy')
    const _rect = this.tag.getBoundingClientRect()
    const _top = window.scrollY
    const _left = window.scrollX
    const _side = this.tag.dataset.tipfySide
    if (!_side) {
      const _xLeft = _rect.x < window.outerWidth / 2
      const _yTop = _rect.y < window.outerHeight / 2
      if (window.innerWidth < 1024) {
        _tipfy.classList.add(`tipfy--${_yTop ? 'top' : 'bottom'}`)
        _tipfy.classList.add('tipfy--side-auto')
        _tipfy.style.left = _rect.x + (_rect.width - _tipfy.clientWidth) / 2 + _left + 'px'
        _tipfy.style.top = (_yTop ? _rect.y + _rect.height : _rect.y - _tipfy.clientHeight) + _top + 'px'
      } else {
        _tipfy.classList.add(`tipfy--${_xLeft ? 'left' : 'right'}`)
        _tipfy.classList.add(`tipfy--${_yTop ? 'top' : 'bottom'}`)
        _tipfy.style.left = (_xLeft ? _rect.x : _rect.x + _rect.width - _tipfy.clientWidth) + _left + 'px'
        _tipfy.style.top = (_yTop ? _rect.y + _rect.height : _rect.y - _tipfy.clientHeight) + _top + 'px'
      }
    } else {
      const position = {
        left: () =>
          _tipfy.setAttribute(
            'style',
            `left: ${_rect.x - _tipfy.clientWidth + _left}px;top: ${
              _rect.y + (_rect.height - _tipfy.clientHeight) / 2 + _top
            }px;`,
          ),
        right: () =>
          _tipfy.setAttribute(
            'style',
            `left: ${_rect.x + _rect.width + _left}px;top: ${
              _rect.y + (_rect.height - _tipfy.clientHeight) / 2 + _top
            }px;`,
          ),
        top: () =>
          _tipfy.setAttribute(
            'style',
            `left: ${_rect.x + (_rect.width - _tipfy.clientWidth) / 2 + _left}px;top: ${
              _rect.y - _tipfy.clientHeight + _top
            }px;`,
          ),
        bottom: () =>
          _tipfy.setAttribute(
            'style',
            `left: ${_rect.x + (_rect.width - _tipfy.clientWidth) / 2 + _left}px;top: ${
              _rect.y + _rect.height + _top
            }px;`,
          ),
      }
      position[_side]()
      _tipfy.classList.add(`tipfy--side-${_side}`)
    }
  }

  remove() {
    try {
      document.querySelector('.tipfy').remove()
    } catch (e) {}
  }
}
