(function () {
  'use strict';

  var state = {
    started: false,
    arranging: false,
    menu: null,
    more: null,
    moreMenu: null,
    nav: null,
    resizeObserver: null,
    mutationObserver: null,
    waitObserver: null,
    waitTimer: 0,
    layoutTimer: 0,
    closeTimer: 0,
    pinnedItem: null,
    raf: 0,
    original: null,
  };

  var CLOSE_DELAY_MS = 120;

  function scheduleLayout() {
    if (!state.started || state.raf) {
      return;
    }
    state.raf = window.requestAnimationFrame(function () {
      state.raf = 0;
      arrangeMenu();
    });
  }

  function isManagedItem(item) {
    return item && item.nodeType === 1 && item !== state.more;
  }

  function itemHasSubmenu(item) {
    return !!(item && item.querySelector(':scope > ul'));
  }

  function openItem(item) {
    if (!itemHasSubmenu(item)) {
      return;
    }
    var link = item.querySelector(':scope > a');
    var submenu = item.querySelector(':scope > ul');
    item.classList.add('topmenu-open');
    if (link) {
      link.setAttribute('aria-expanded', 'true');
    }
    submenu.style.removeProperty('display');
  }

  function closeItem(item) {
    if (!itemHasSubmenu(item)) {
      return;
    }
    var link = item.querySelector(':scope > a');
    var submenu = item.querySelector(':scope > ul');
    item.classList.remove('topmenu-open');
    if (link) {
      link.setAttribute('aria-expanded', 'false');
    }
    if (document.activeElement && item.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    submenu.style.setProperty('display', 'none');
  }

  function dropdownBranch(item) {
    var branch = new Set();
    var current = item;
    while (current && current !== state.menu) {
      if (current.tagName === 'LI' && itemHasSubmenu(current)) {
        branch.add(current);
      }
      current = current.parentElement && current.parentElement.closest('li');
    }
    return branch;
  }

  function closeMenus(except) {
    if (!state.menu) {
      return;
    }
    var keep = except ? dropdownBranch(except) : new Set();
    Array.prototype.forEach.call(state.menu.querySelectorAll('li'), function (item) {
      if (keep.has(item)) {
        openItem(item);
      } else {
        closeItem(item);
      }
    });
  }

  function closeAllMenus() {
    state.pinnedItem = null;
    closeMenus();
  }

  function cancelScheduledClose() {
    if (state.closeTimer) {
      window.clearTimeout(state.closeTimer);
      state.closeTimer = 0;
    }
  }

  function scheduleClose() {
    cancelScheduledClose();
    state.closeTimer = window.setTimeout(function () {
      state.closeTimer = 0;
      if (state.pinnedItem && state.pinnedItem.isConnected) {
        closeMenus(state.pinnedItem);
      } else {
        closeAllMenus();
      }
    }, CLOSE_DELAY_MS);
  }

  function decorateItem(item) {
    if (!isManagedItem(item) && item !== state.more) {
      return;
    }
    if (state.original && !state.original.itemClasses.has(item)) {
      state.original.itemClasses.set(item, item.className);
    }
    var link = item.querySelector(':scope > a');
    var submenu = item.querySelector(':scope > ul');
    if (!link || !submenu) {
      return;
    }
    item.classList.remove('pull-left', 'pull-right');
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');
    if (!link.querySelector(':scope > .topmenu-caret')) {
      var caret = document.createElement('i');
      caret.className = 'fa fa-caret-down topmenu-caret';
      caret.setAttribute('aria-hidden', 'true');
      link.appendChild(caret);
    }
  }

  function restoreItems() {
    var fragment = document.createDocumentFragment();
    Array.prototype.slice.call(state.moreMenu.children).forEach(function (item) {
      fragment.appendChild(item);
    });
    state.menu.insertBefore(fragment, state.more);
  }

  function updateItemDirections() {
    Array.prototype.forEach.call(state.menu.children, function (item) {
      if (item === state.more) {
        return;
      }
      var link = item.querySelector(':scope > a');
      var caret = item.querySelector(':scope > a > .topmenu-caret');
      if (!link || !caret) {
        return;
      }
      caret.classList.remove('fa-caret-left');
      caret.classList.add('fa-caret-down');
      link.appendChild(caret);
    });
    Array.prototype.forEach.call(state.moreMenu.children, function (item) {
      var link = item.querySelector(':scope > a');
      var caret = item.querySelector(':scope > a > .topmenu-caret');
      if (!link || !caret) {
        return;
      }
      caret.classList.remove('fa-caret-down');
      caret.classList.add('fa-caret-left');
      link.insertBefore(caret, link.firstChild);
    });
  }

  function overflows() {
    return state.menu.scrollWidth > state.nav.clientWidth + 1;
  }

  function tidyMoreDividers() {
    var children = Array.prototype.slice.call(state.moreMenu.children);
    children.forEach(function (item, index) {
      if (!item.classList.contains('red-ui-menu-divider')) {
        return;
      }
      item.style.display =
        index === 0 ||
        index === children.length - 1 ||
        children[index - 1].classList.contains('red-ui-menu-divider')
          ? 'none'
          : '';
    });
  }

  function arrangeMenu() {
    if (!state.started || state.arranging || !state.nav.clientWidth) {
      return;
    }
    state.arranging = true;
    restoreItems();
    state.more.style.display = 'none';

    if (overflows()) {
      state.more.style.display = 'block';
      while (overflows()) {
        var candidate = state.more.previousElementSibling;
        if (!candidate || candidate === state.more) {
          break;
        }
        state.moreMenu.insertBefore(candidate, state.moreMenu.firstChild);
      }
    }

    tidyMoreDividers();
    updateItemDirections();
    closeAllMenus();
    /* Discard records generated by our own DOM moves. Without this, the
           observer would schedule another identical layout every frame. */
    if (state.mutationObserver) {
      state.mutationObserver.takeRecords();
    }
    state.arranging = false;
  }

  function createMoreItem() {
    var item = document.createElement('li');
    item.className = 'red-ui-menu-dropdown-submenu topmenu-more';
    item.style.display = 'none';

    var link = document.createElement('a');
    link.href = '#';
    link.innerHTML = '<span class="red-ui-menu-label"><span>More</span></span>';
    item.appendChild(link);

    var submenu = document.createElement('ul');
    submenu.className = 'red-ui-menu red-ui-menu-dropdown red-ui-menu-dropdown-noicons';
    item.appendChild(submenu);
    return item;
  }

  function handleMenuClick(event) {
    var link = event.target.closest('a');
    if (!link || !state.menu.contains(link)) {
      return;
    }
    var item = link.parentElement;
    var submenu = item && item.querySelector(':scope > ul');

    if (item && submenu) {
      event.preventDefault();
      event.stopPropagation();
      var opening = state.pinnedItem !== item || !item.classList.contains('topmenu-open');
      if (opening) {
        state.pinnedItem = item;
        closeMenus(item);
        openItem(item);
      } else {
        closeAllMenus();
      }
    } else if (!submenu) {
      closeAllMenus();
    }
  }

  function handleMenuHover(event) {
    var item = event.target.closest('li');
    if (!item || !state.menu.contains(item)) {
      return;
    }

    if (event.relatedTarget && item.contains(event.relatedTarget)) {
      return;
    }
    if (!itemHasSubmenu(item)) {
      return;
    }
    cancelScheduledClose();
    if (state.pinnedItem && state.pinnedItem !== item) {
      var pinnedBranch = dropdownBranch(state.pinnedItem);
      var hoveredBranch = dropdownBranch(item);
      if (!pinnedBranch.has(item) && !hoveredBranch.has(state.pinnedItem)) {
        state.pinnedItem = null;
      }
    }
    closeMenus(item);
    openItem(item);
  }

  function handleDocumentClick(event) {
    if (!state.nav || !state.nav.contains(event.target)) {
      closeAllMenus();
    }
  }

  function handleDocumentKeyDown(event) {
    if (event.key === 'Escape') {
      closeAllMenus();
    }
  }

  function start() {
    if (state.started) {
      return true;
    }
    var header = document.getElementById('red-ui-header');
    var logo = document.getElementById('red-ui-header-logo');
    var toolbar = document.getElementById('red-ui-header-toolbar');
    var hamburger = document.getElementById('red-ui-header-button-sidemenu');
    var menu = document.getElementById('red-ui-header-button-sidemenu-submenu');
    var tabs = document.getElementById('red-ui-header-tabs');
    var workspace = document.getElementById('red-ui-workspace');
    if (!header || !logo || !toolbar || !hamburger || !menu || !tabs || !workspace) {
      return false;
    }

    state.started = true;
    state.menu = menu;
    state.more = createMoreItem();
    state.moreMenu = state.more.querySelector('ul');
    state.nav = document.createElement('nav');
    state.nav.id = 'red-ui-topmenu';
    state.nav.setAttribute('aria-label', hamburger.getAttribute('aria-label') || 'Main menu');
    state.original = {
      header: header,
      workspace: workspace,
      menuParent: menu.parentNode,
      menuNextSibling: menu.nextSibling,
      menuClassName: menu.className,
      menuStyle: menu.getAttribute('style'),
      menuRole: menu.getAttribute('role'),
      tabs: tabs,
      tabsParent: tabs.parentNode,
      tabsNextSibling: tabs.nextSibling,
      hamburgerParent: hamburger.parentElement,
      hamburgerDisplay: hamburger.parentElement.style.display,
      itemClasses: new Map(),
    };

    header.classList.add('topmenu-active');
    workspace.classList.add('topmenu-workspace');
    menu.removeAttribute('style');
    menu.classList.remove(
      'pull-left',
      'pull-right',
      'red-ui-menu-dropdown',
      'red-ui-menu-dropdown-noicons',
      'red-ui-menu-dropdown-submenus',
    );
    menu.setAttribute('role', 'menubar');
    menu.appendChild(state.more);
    Array.prototype.forEach.call(menu.children, decorateItem);
    state.nav.appendChild(menu);
    header.insertBefore(state.nav, toolbar);
    workspace.insertBefore(tabs, workspace.firstChild);
    hamburger.parentElement.style.display = 'none';

    state.nav.addEventListener('click', handleMenuClick, true);
    state.nav.addEventListener('mouseover', handleMenuHover);
    state.nav.addEventListener('mouseenter', cancelScheduledClose);
    state.nav.addEventListener('mouseleave', scheduleClose);
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeyDown);

    state.resizeObserver = new ResizeObserver(scheduleLayout);
    state.resizeObserver.observe(state.nav);
    state.resizeObserver.observe(toolbar);

    state.mutationObserver = new MutationObserver(function (mutations) {
      if (state.arranging) {
        return;
      }
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, function (node) {
          if (isManagedItem(node) && node.parentElement === state.menu) {
            state.menu.insertBefore(node, state.more);
            decorateItem(node);
          }
        });
      });
      scheduleLayout();
    });
    state.mutationObserver.observe(menu, { childList: true });

    scheduleLayout();
    state.layoutTimer = window.setTimeout(function () {
      state.layoutTimer = 0;
      scheduleLayout();
    }, 250);
    return true;
  }

  function waitForEditor() {
    if (start()) {
      return;
    }
    state.waitObserver = new MutationObserver(function () {
      if (start()) {
        state.waitObserver.disconnect();
        state.waitObserver = null;
      }
    });
    state.waitObserver.observe(document.documentElement, { childList: true, subtree: true });
    state.waitTimer = window.setTimeout(function () {
      state.waitTimer = 0;
      if (state.waitObserver) {
        state.waitObserver.disconnect();
        state.waitObserver = null;
      }
      start();
    }, 15000);
  }

  function stop() {
    cancelScheduledClose();
    if (state.layoutTimer) {
      window.clearTimeout(state.layoutTimer);
    }
    if (state.waitTimer) {
      window.clearTimeout(state.waitTimer);
    }
    if (state.raf) {
      window.cancelAnimationFrame(state.raf);
    }
    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
    }
    if (state.mutationObserver) {
      state.mutationObserver.disconnect();
    }
    if (state.waitObserver) {
      state.waitObserver.disconnect();
    }

    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleDocumentKeyDown);
    if (state.nav) {
      state.nav.removeEventListener('click', handleMenuClick, true);
      state.nav.removeEventListener('mouseover', handleMenuHover);
      state.nav.removeEventListener('mouseenter', cancelScheduledClose);
      state.nav.removeEventListener('mouseleave', scheduleClose);
    }

    if (state.started && state.original) {
      restoreItems();
      if (state.more) {
        state.more.remove();
      }
      state.menu.querySelectorAll('.topmenu-caret').forEach(function (caret) {
        caret.remove();
      });
      state.original.itemClasses.forEach(function (className, item) {
        if (!item.isConnected) {
          return;
        }
        item.className = className;
        var link = item.querySelector(':scope > a');
        var submenu = item.querySelector(':scope > ul');
        if (link) {
          link.removeAttribute('aria-haspopup');
          link.removeAttribute('aria-expanded');
        }
        if (submenu) {
          submenu.style.removeProperty('display');
        }
      });
      state.menu.className = state.original.menuClassName;
      if (state.original.menuStyle === null) {
        state.menu.removeAttribute('style');
      } else {
        state.menu.setAttribute('style', state.original.menuStyle);
      }
      if (state.original.menuRole === null) {
        state.menu.removeAttribute('role');
      } else {
        state.menu.setAttribute('role', state.original.menuRole);
      }

      var menuReference =
        state.original.menuNextSibling &&
        state.original.menuNextSibling.parentNode === state.original.menuParent
          ? state.original.menuNextSibling
          : null;
      var tabsReference =
        state.original.tabsNextSibling &&
        state.original.tabsNextSibling.parentNode === state.original.tabsParent
          ? state.original.tabsNextSibling
          : null;
      state.original.menuParent.insertBefore(state.menu, menuReference);
      state.original.tabsParent.insertBefore(state.original.tabs, tabsReference);
      state.original.hamburgerParent.style.display = state.original.hamburgerDisplay;
      state.original.header.classList.remove('topmenu-active');
      state.original.workspace.classList.remove('topmenu-workspace');
      if (state.nav) {
        state.nav.remove();
      }
    }

    state.started = false;
    state.arranging = false;
    state.menu = null;
    state.more = null;
    state.moreMenu = null;
    state.nav = null;
    state.resizeObserver = null;
    state.mutationObserver = null;
    state.waitObserver = null;
    state.waitTimer = 0;
    state.layoutTimer = 0;
    state.pinnedItem = null;
    state.raf = 0;
    state.original = null;
  }

  RED.plugins.registerPlugin('topmenu', {
    type: 'topmenu',
    name: 'Top Menu',
    onadd: waitForEditor,
    onremove: stop,
  });
})();
