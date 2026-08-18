/**
 * SmartWarehouse AI - Notification Center & Toast System
 * Real-time alert bell, unread badge counter, and floating toast notifications.
 */

const NotificationsComponent = {
  isOpen: false,

  init() {
    this.bindEvents();
    this.render();
    window.stateStore.on('notification:added', (notif) => {
      this.showToast(notif);
      this.render();
    });
    window.stateStore.on('notification:read', () => this.render());
    window.stateStore.on('notifications:allRead', () => this.render());
  },

  bindEvents() {
    const bellBtn = document.getElementById('btn-notification-bell');
    if (bellBtn) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Close on outer click
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('notification-popover');
      if (popover && !popover.contains(e.target) && !e.target.closest('#btn-notification-bell')) {
        this.close();
      }
    });

    const markAllBtn = document.getElementById('btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        window.stateStore.markAllNotificationsRead();
      });
    }
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
    this.isOpen = true;
    const popover = document.getElementById('notification-popover');
    if (popover) popover.classList.add('open');
  },

  close() {
    this.isOpen = false;
    const popover = document.getElementById('notification-popover');
    if (popover) popover.classList.remove('open');
  },

  render() {
    const store = window.stateStore;
    const notifications = store.getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;

    // Update bell badge
    const badgeEl = document.getElementById('notif-unread-badge');
    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.textContent = unreadCount;
        badgeEl.style.display = 'flex';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    const listContainer = document.getElementById('notif-list-container');
    if (!listContainer) return;

    if (notifications.length === 0) {
      listContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No notifications right now.</div>`;
      return;
    }

    listContainer.innerHTML = notifications.map(n => `
      <div class="notif-item ${!n.read ? 'unread' : ''}" onclick="NotificationsComponent.handleNotifClick('${n.id}', '${n.actionUrl}')">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 0.82rem; color: ${n.type === 'critical' ? 'var(--status-critical)' : n.type === 'warning' ? 'var(--status-warning)' : 'var(--text-primary)'};">
            ${n.title}
          </strong>
          <span style="font-size: 0.7rem; color: var(--text-muted);">${n.timestamp}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${n.message}</div>
      </div>
    `).join('');
  },

  handleNotifClick(id, actionUrl) {
    const store = window.stateStore;
    store.markNotificationRead(id);
    this.close();
    if (actionUrl && window.appRouter) {
      window.appRouter.navigateTo(actionUrl);
    }
  },

  showToast(notif) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = '🔔';
    if (notif.type === 'critical') icon = '🚨';
    else if (notif.type === 'warning') icon = '⚠️';
    else if (notif.type === 'success') icon = '✅';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-content">
        <div class="toast-title">${notif.title}</div>
        <div class="toast-message">${notif.message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

window.NotificationsComponent = NotificationsComponent;
