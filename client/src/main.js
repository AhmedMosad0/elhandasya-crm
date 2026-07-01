import { doLogin, logout, togglePortal, showApp, checkSession } from './auth/auth.js';
import { navigate } from './router.js';
import { openModal, closeModal } from './components/modal/modal.js';
import { showToast } from './components/toast/toast.js';
import { renderNav, updateNotifDot } from './components/sidebar/sidebar.js';
import { handleSearch } from './components/topbar/topbar.js';

import { renderDashboard } from './views/dashboard/dashboard.js';
import {
  renderRequests, openNewRequestModal, approveRequest, promptReject, doReject,
  addPline, removePline, calcTotal, submitNewRequest, fillClient,
} from './views/requests/requests.js';
import {
  renderOrders, openOrderModal, togDel, assignUser, updateOrderStatus,
  updatePayStatus, openAddPayment, savePayment, printReceipt,
} from './views/orders/orders.js';
import { renderClients, openClientModal, openAddClient, saveNewClient } from './views/clients/clients.js';
import { renderReports, genReport } from './views/reports/reports.js';
import { renderMyWork, markMixed } from './views/mywork/mywork.js';
import { renderClientPortal } from './views/client-portal/client-portal.js';
import { renderClientOrders, openClientOrderDetail } from './views/client-orders/client-orders.js';
import { renderClientNewOrder, addCPline, rmCPline, calcCT, submitClientOrder } from './views/client-neworder/client-neworder.js';
import { renderClientAccount } from './views/client-account/client-account.js';

// Wire functions referenced from inline onclick/oninput attributes onto window.
Object.assign(window, {
  doLogin, logout, togglePortal, navigate, handleSearch,
  openModal, closeModal, showToast,
  renderDashboard,
  renderRequests, openNewRequestModal, approveRequest, promptReject, doReject,
  addPline, removePline, calcTotal, submitNewRequest, fillClient,
  renderOrders, openOrderModal, togDel, assignUser, updateOrderStatus,
  updatePayStatus, openAddPayment, savePayment, printReceipt,
  renderClients, openClientModal, openAddClient, saveNewClient,
  renderReports, genReport,
  renderMyWork, markMixed,
  renderClientPortal,
  renderClientOrders, openClientOrderDetail,
  renderClientNewOrder, addCPline, rmCPline, calcCT, submitClientOrder,
  renderClientAccount,
  _renderNav: renderNav,
  _updateNotifDot: updateNotifDot,
  _showApp: showApp,
});

window.onload = () => {
  checkSession();
};
