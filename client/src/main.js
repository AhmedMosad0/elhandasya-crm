import { applyDocumentDir, setLang, getLang } from './i18n/index.js';
import { App } from './state/store.js';
import { doLogin, logout, togglePortal, showApp, checkSession, doSignup, showSignup, showLogin, selectSignupRole } from './auth/auth.js';
import { navigate } from './router.js';
import { openModal, closeModal } from './components/modal/modal.js';
import { showToast } from './components/toast/toast.js';
import { renderNav, updateNotifDot } from './components/sidebar/sidebar.js';
import { handleSearch } from './components/topbar/topbar.js';

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

// Wire functions referenced from inline onclick/oninput attributes onto window.
Object.assign(window, {
  doLogin, logout, togglePortal, navigate, handleSearch,
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
  _updateNotifDot: updateNotifDot,
  _showApp: showApp,
});

window.__rerender = () => { if (window.navigate && App.section) window.navigate(App.section); };

window.onload = () => {
  applyDocumentDir();
  checkSession();
};
