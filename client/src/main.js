import { applyDocumentDir, setLang, getLang, updateLangBtns } from './i18n/index.js';
import { App } from './state/store.js';
import { doLogin, logout, togglePortal, showApp, checkSession, doSignup, showSignup, showLogin, selectSignupRole, refreshLoginForm } from './auth/auth.js';
import { navigate } from './router.js';
import { openModal, closeModal } from './components/modal/modal.js';
import { showToast } from './components/toast/toast.js';
import { renderNav, renderSidebar, updateNotifDot } from './components/sidebar/sidebar.js';
import { handleSearch, updateTopbar } from './components/topbar/topbar.js';

import { renderDashboard } from './views/dashboard/dashboard.js';
import {
  renderRequests, openNewRequestModal, approveRequest, promptReject, doReject,
  addPline, removePline, calcTotal, submitNewRequest, fillClient,
  promptApproveWithSales, doApproveWithSales, doFinalApprove,
  openPricingModal, calcPricingTotal, submitPricing,
  claimConsultation, openConsultPricingModal, submitConsultPricing,
  openCallStatusModal, openAdminNotesModal, toggleClaimWithoutPayment, markDelivered,
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
import { renderClientNewOrder, addCPline, rmCPline, calcCT, submitClientOrder, submitConsultation } from './views/client-neworder/client-neworder.js';
import { renderClientAccount } from './views/client-account/client-account.js';
import { renderUsers, approveUserById, rejectUserById } from './views/users/users.js';
import { renderProducts, openProductForm, saveProductForm } from './views/products/products.js';
import { openProductPicker, closeProductPicker } from './components/ProductPicker/product-picker.js';
import * as api from './api/index.js';
import {
  openPhoneCall, openWhatsApp,
  buildWAInitialContact, buildWAPricingReady,
  buildWAOrderConfirmed, buildWAReceipt,
  printReceipt as printDoc,
} from './utils/index.js';

// Wire functions referenced from inline onclick/oninput attributes onto window.
Object.assign(window, {
  doLogin, logout, togglePortal, navigate, handleSearch,
  doLogout: () => logout(),
  switchLang: () => setLang(getLang() === 'ar' ? 'en' : 'ar'),
  doSignup, showSignup, showLogin, selectSignupRole,
  renderUsers, approveUserById, rejectUserById,
  renderProducts, openProductForm, saveProductForm,
  openProductPicker, closeProductPicker,
  openModal, closeModal, showToast,
  renderDashboard,
  renderRequests, openNewRequestModal, approveRequest, promptReject, doReject,
  addPline, removePline, calcTotal, submitNewRequest, fillClient,
  promptApproveWithSales, doApproveWithSales, doFinalApprove,
  openPricingModal, calcPricingTotal, submitPricing,
  claimConsultation, openConsultPricingModal, submitConsultPricing,
  openCallStatusModal, openAdminNotesModal, toggleClaimWithoutPayment, markDelivered,
  renderOrders, openOrderModal, togDel, assignUser, updateOrderStatus,
  updatePayStatus, openAddPayment, savePayment, printReceipt,
  renderClients, openClientModal, openAddClient, saveNewClient,
  renderReports, genReport,
  renderMyWork, markMixed,
  renderClientPortal,
  renderClientOrders, openClientOrderDetail,
  renderClientNewOrder, addCPline, rmCPline, calcCT, submitClientOrder, submitConsultation,
  renderClientAccount,
  _renderNav: renderNav,
  _renderSidebar: renderSidebar,
  _updateTopbar: updateTopbar,
  _updateNotifDot: updateNotifDot,
  _showApp: showApp,
});

window._refreshLogin = refreshLoginForm;

// ── WhatsApp / Call / Print handlers ──
window.callClient = (phone) => openPhoneCall(phone);

window.callClientOrder = async (orderId) => {
  const o = await api.getOrder(orderId);
  openPhoneCall(o.clientPhone);
};

window.waInitial = async (reqId) => {
  const req = await api.getRequest(reqId);
  openWhatsApp(req.phone, buildWAInitialContact(req.clientName, App.user.name));
};

window.waPricing = async (reqId) => {
  const req = await api.getRequest(reqId);
  openWhatsApp(req.phone, buildWAPricingReady(req.clientName, App.user.name, req.ref, req.totalAmount));
};

window.printRequestReceipt = async (reqId) => {
  const req = await api.getRequest(reqId);
  printDoc(req);
};

window.waOrderConfirmed = async (orderId) => {
  const o = await api.getOrder(orderId);
  openWhatsApp(o.clientPhone, buildWAOrderConfirmed(o.clientName, o.recipeNum, o.totalAmount, o.products));
};

window.waOrderReceipt = async (orderId) => {
  const o = await api.getOrder(orderId);
  openWhatsApp(o.clientPhone, buildWAReceipt(o.clientName, o.recipeNum, o.products, o.totalAmount, o.paidAmount, o.totalAmount - o.paidAmount));
};

window.printOrder = async (orderId) => {
  const o = await api.getOrder(orderId);
  printDoc(o);
};

// Full atomic re-render: lang buttons → login form → sidebar → topbar → current view
window.__rerenderAll = () => {
  updateLangBtns();                                    // all .lang-btn labels everywhere
  if (window._refreshLogin) window._refreshLogin();   // login screen labels (if visible)
  if (App.user) {
    renderNav();                                       // sidebar nav labels + logout btn
    updateTopbar();                                    // search input placeholder
    if (App.section) navigate(App.section);            // current view + tbTitle
  }
};

window.onload = () => {
  applyDocumentDir();
  updateLangBtns();
  refreshLoginForm();
  checkSession();
};
