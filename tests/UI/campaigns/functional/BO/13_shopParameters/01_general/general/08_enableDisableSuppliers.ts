// Import utils
import testContext from '@utils/testContext';

// Import pages
// Import BO pages
import brandsPage from '@pages/BO/catalog/brands';
import suppliersPage from '@pages/BO/catalog/suppliers';
// Import FO pages
import {siteMapPage} from '@pages/FO/classic/siteMap';

import {expect} from 'chai';
import type {BrowserContext, Page} from 'playwright';
import {
  boDashboardPage,
  boLoginPage,
  boShopParametersPage,
  foClassicHomePage,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_shopParameters_general_general_enableDisableSuppliers';

/*
Enable/Disable suppliers
Check the alert message from BO Suppliers page
Go to FO to check suppliers link in sitemap page
 */
describe('BO - Shop Parameters - General : Enable/Disable display suppliers', async () => {
  let browserContext: BrowserContext;
  let page: Page;

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

  const tests = [
    {args: {action: 'Enable', exist: true}},
    {args: {action: 'Disable', exist: false}},
  ];

  tests.forEach((test, index: number) => {
    describe(`${test.args.action} Display suppliers`, async () => {
      it('should go to \'Shop parameters > General\' page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToGeneralPage_${index}`, baseContext);

        await boDashboardPage.goToSubMenu(
          page,
          boDashboardPage.shopParametersParentLink,
          boDashboardPage.shopParametersGeneralLink,
        );
        await boShopParametersPage.closeSfToolBar(page);

        const pageTitle = await boShopParametersPage.getPageTitle(page);
        expect(pageTitle).to.contains(boShopParametersPage.pageTitle);
      });

      it(`should ${test.args.action} display suppliers`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.action}DisplaySuppliers`, baseContext);

        const result = await boShopParametersPage.setDisplaySuppliers(page, test.args.exist);
        expect(result).to.contains(boShopParametersPage.successfulUpdateMessage);
      });

      if (test.args.action === 'Disable') {
        it('should go to \'Brands & Suppliers\' page', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToBrandsPage_${index}`, baseContext);

          await boShopParametersPage.goToSubMenu(
            page,
            boShopParametersPage.catalogParentLink,
            boShopParametersPage.brandsAndSuppliersLink,
          );

          const pageTitle = await brandsPage.getPageTitle(page);
          expect(pageTitle).to.contains(brandsPage.pageTitle);
        });

        it('should go to \'Suppliers\' tab', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToSuppliersTab_${index}`, baseContext);

          await brandsPage.goToSubTabSuppliers(page);

          const pageTitle = await suppliersPage.getPageTitle(page);
          expect(pageTitle).to.contains(suppliersPage.pageTitle);
        });

        it(`should check that the message alert contains '${test.args.action}'`, async function () {
          await testContext.addContextItem(this, 'testIdentifier', `checkAlertContains_${test.args.action}`, baseContext);

          const text = await suppliersPage.getAlertInfoBlockParagraphContent(page);
          expect(text).to.contains(test.args.action.toLowerCase());
        });
      }

      it('should go to FO', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToFO_${test.args.action}`, baseContext);

        // View shop
        page = await suppliersPage.viewMyShop(page);
        // Change shop language
        await foClassicHomePage.changeLanguage(page, 'en');

        const isHomePage = await foClassicHomePage.isHomePage(page);
        expect(isHomePage).to.eq(true);
      });

      it('should verify the existence of the suppliers page link', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `checkSuppliersPage_${test.args.action}`, baseContext);

        await foClassicHomePage.goToFooterLink(page, 'Sitemap');

        const pageTitle = await siteMapPage.getPageTitle(page);
        expect(pageTitle).to.equal(siteMapPage.pageTitle);

        const exist = await siteMapPage.isSuppliersLinkVisible(page);
        expect(exist).to.be.equal(test.args.exist);
      });

      if (test.args.action === 'Enable') {
        it('should go back to BO', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goBackToBo_${test.args.action}`, baseContext);

          page = await siteMapPage.closePage(browserContext, page, 0);

          const pageTitle = await boShopParametersPage.getPageTitle(page);
          expect(pageTitle).to.contains(boShopParametersPage.pageTitle);
        });
      }
    });
  });
});
