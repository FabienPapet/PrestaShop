// Import utils
import testContext from '@utils/testContext';

// Import pages
import contactsPage from '@pages/BO/shopParameters/contact';
import addContactPage from '@pages/BO/shopParameters/contact/add';

import {expect} from 'chai';
import type {BrowserContext, Page} from 'playwright';
import {
  boDashboardPage,
  boLoginPage,
  FakerContact,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_shopParameters_contact_contacts_CRUDContact';

// Create, Update and Delete contact in BO
describe('BO - Shop Parameters - Contact : Create, Update and Delete contact in BO', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let numberOfContacts: number = 0;

  const createContactData: FakerContact = new FakerContact();
  const editContactData: FakerContact = new FakerContact({saveMessage: false});

  // before and after functions
  before(async function () {
    browserContext = await utilsPlaywright.createBrowserContext(this.browser);
    page = await utilsPlaywright.newTab(browserContext);
  });

  after(async () => {
    await utilsPlaywright.closeBrowserContext(browserContext);
  });

  it('should login in BO', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'loginBO', baseContext);

    await boLoginPage.goTo(page, global.BO.URL);
    await boLoginPage.successLogin(page, global.BO.EMAIL, global.BO.PASSWD);

    const pageTitle = await boDashboardPage.getPageTitle(page);
    expect(pageTitle).to.contains(boDashboardPage.pageTitle);
  });

  it('should go to \'Shop parameters > Contact\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToContactsPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.shopParametersParentLink,
      boDashboardPage.contactLink,
    );
    await contactsPage.closeSfToolBar(page);

    const pageTitle = await contactsPage.getPageTitle(page);
    expect(pageTitle).to.contains(contactsPage.pageTitle);
  });

  it('should reset all filters', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFilterFirst', baseContext);

    numberOfContacts = await contactsPage.resetAndGetNumberOfLines(page);
    expect(numberOfContacts).to.be.above(0);
  });

  // 1 : Create contact in BO
  describe('Create contact in BO', async () => {
    it('should go to add new contact page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewContact', baseContext);

      await contactsPage.goToAddNewContactPage(page);

      const pageTitle = await addContactPage.getPageTitle(page);
      expect(pageTitle).to.contains(addContactPage.pageTitleCreate);
    });

    it('should create contact and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createContact', baseContext);

      const textResult = await addContactPage.createEditContact(page, createContactData);
      expect(textResult).to.equal(contactsPage.successfulCreationMessage);

      const numberOfContactsAfterCreation = await contactsPage.getNumberOfElementInGrid(page);
      expect(numberOfContactsAfterCreation).to.be.equal(numberOfContacts + 1);
    });
  });

  // 2 : Update contact
  describe('Update contact created', async () => {
    it('should filter list by email', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterForUpdate', baseContext);

      await contactsPage.resetFilter(page);
      await contactsPage.filterContacts(page, 'email', createContactData.email);

      const textEmail = await contactsPage.getTextColumnFromTableContacts(page, 1, 'email');
      expect(textEmail).to.contains(createContactData.email);
    });

    it('should go to edit contact page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToEditContactPage', baseContext);

      await contactsPage.goToEditContactPage(page, 1);

      const pageTitle = await addContactPage.getPageTitle(page);
      expect(pageTitle).to.contains(addContactPage.pageTitleEdit);
    });

    it('should update contact', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'updateContact', baseContext);

      const textResult = await addContactPage.createEditContact(page, editContactData);
      expect(textResult).to.equal(contactsPage.successfulUpdateMessage);

      const numberOfContactsAfterUpdate = await contactsPage.resetAndGetNumberOfLines(page);
      expect(numberOfContactsAfterUpdate).to.be.equal(numberOfContacts + 1);
    });
  });

  // 3 : Delete contact from BO
  describe('Delete contact', async () => {
    it('should filter list by email', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterForDelete', baseContext);

      await contactsPage.resetFilter(page);
      await contactsPage.filterContacts(page, 'email', editContactData.email);

      const textEmail = await contactsPage.getTextColumnFromTableContacts(page, 1, 'email');
      expect(textEmail).to.contains(editContactData.email);
    });

    it('should delete contact', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteContact', baseContext);

      const textResult = await contactsPage.deleteContact(page, 1);
      expect(textResult).to.equal(contactsPage.successfulDeleteMessage);

      const numberOfContactsAfterDelete = await contactsPage.resetAndGetNumberOfLines(page);
      expect(numberOfContactsAfterDelete).to.be.equal(numberOfContacts);
    });
  });
});
