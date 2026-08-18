/**
 * SmartWarehouse AI - Role Switcher Component
 * Toggles between Warehouse Manager (executive analytics & overrides) and Floor Picker / Specialist views.
 */

const RoleSwitcher = {
  init() {
    this.bindEvents();
    this.updateUI(window.stateStore.currentRole);
    window.stateStore.on('role:changed', (role) => this.updateUI(role));
  },

  bindEvents() {
    const select = document.getElementById('role-select-dropdown');
    if (select) {
      select.value = window.stateStore.currentRole;
      select.addEventListener('change', (e) => {
        window.stateStore.setRole(e.target.value);
      });
    }
  },

  updateUI(role) {
    const roleBadge = document.getElementById('current-role-badge');
    const roleTitle = document.getElementById('current-role-title');

    if (role === 'picker') {
      if (roleBadge) roleBadge.textContent = 'Floor Specialist';
      if (roleTitle) roleTitle.textContent = 'Picker / QC Mode';
      document.body.classList.add('role-picker-mode');
      
      // Notify
      window.stateStore.addNotification({
        type: 'info',
        title: 'Floor Specialist Mode Active',
        message: 'Streamlined view enabled for picking waves, barcode verification, and exception logging.',
        actionUrl: 'pick-pack'
      });
    } else {
      if (roleBadge) roleBadge.textContent = 'Warehouse Manager';
      if (roleTitle) roleTitle.textContent = 'Manager Portal';
      document.body.classList.remove('role-picker-mode');
    }
  }
};

window.RoleSwitcher = RoleSwitcher;
