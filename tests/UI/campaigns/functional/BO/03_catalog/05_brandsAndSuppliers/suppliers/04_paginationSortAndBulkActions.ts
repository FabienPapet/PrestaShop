// Import utils
import testContext from '@utils/testContext';

// Import pages
import brandsPage from '@pages/BO/catalog/brands';
import suppliersPage from '@pages/BO/catalog/suppliers';

import {expect} from 'chai';
import type {BrowserContext, Page} from 'playwright';
import {
  boDashboardPage,
  boLoginPage,
  boSuppliersCreate,
  FakerSupplier,
  utilsCore,
  utilsFile,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_catalog_brandsAndSuppliers_suppliers_paginationSortAndBulkActions';

/*
Create 11 suppliers
Paginate between pages
Sort suppliers table
Bulk enable and disable suppliers
Bulk delete them
 */
describe('BO - Catalog - Brands & Suppliers : Pagination and sort suppliers', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let numberOfSuppliers: number = 0;

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

  // Go to brands page
  it('should go to \'Catalog > Brands & Suppliers\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToBrandsPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );
    await boDashboardPage.closeSfToolBar(page);

    const pageTitle = await brandsPage.getPageTitle(page);
    expect(pageTitle).to.contains(brandsPage.pageTitle);
  });

  // Go to suppliers page
  it('should go to Suppliers page and get number of suppliers', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToSuppliersPage', baseContext);

    await brandsPage.goToSubTabSuppliers(page);

    const pageTitle = await suppliersPage.getPageTitle(page);
    expect(pageTitle).to.contains(suppliersPage.pageTitle);

    numberOfSuppliers = await suppliersPage.resetAndGetNumberOfLines(page);
  });

  // 1 : Create 11 new suppliers
  describe('Create 11 suppliers in BO', async () => {
    const creationTests: number[] = new Array(11).fill(0, 0, 11);
    creationTests.forEach((test: number, index: number) => {
      const createSupplierData: FakerSupplier = new FakerSupplier({name: `todelete${index}`});
      before(() => utilsFile.generateImage(createSupplierData.logo));

      it('should go to add new supplier page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToAddNewSupplierPage${index}`, baseContext);

        await suppliersPage.goToAddNewSupplierPage(page);

        const pageTitle = await boSuppliersCreate.getPageTitle(page);
        expect(pageTitle).to.contains(boSuppliersCreate.pageTitle);
      });

      it(`should create supplier n°${index + 1} and check result`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `createSupplier${index}`, baseContext);

        const result = await boSuppliersCreate.createEditSupplier(page, createSupplierData);
        expect(result).to.equal(suppliersPage.successfulCreationMessage);

        const numberOfSuppliersAfterCreation = await suppliersPage.getNumberOfElementInGrid(page);
        expect(numberOfSuppliersAfterCreation).to.be.equal(numberOfSuppliers + 1 + index);
      });

      after(() => utilsFile.deleteFile(createSupplierData.logo));
    });
  });

  // 2 : Pagination
  describe('Pagination next and previous', async () => {
    it('should change the items number to 10 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemsNumberTo10', baseContext);

      const paginationNumber = await suppliersPage.selectPaginationLimit(page, 10);
      expect(paginationNumber).to.contains('(page 1 / 2)');
    });

    it('should click on next', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNext', baseContext);

      const paginationNumber = await suppliersPage.paginationNext(page);
      expect(paginationNumber).to.contains('(page 2 / 2)');
    });

    it('should click on previous', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnPrevious', baseContext);

      const paginationNumber = await suppliersPage.paginationPrevious(page);
      expect(paginationNumber).to.contains('(page 1 / 2)');
    });

    it('should change the items number to 50 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemsNumberTo50', baseContext);

      const paginationNumber = await suppliersPage.selectPaginationLimit(page, 50);
      expect(paginationNumber).to.contains('(page 1 / 1)');
    });
  });

  // 3 : Sort suppliers
  describe('Sort suppliers', async () => {
    const brandsTests = [
      {
        args: {
          testIdentifier: 'sortByIdDesc', sortBy: 'id_supplier', sortDirection: 'desc', isFloat: true,
        },
      },
      {args: {testIdentifier: 'sortByNameAsc', sortBy: 'name', sortDirection: 'asc'}},
      {args: {testIdentifier: 'sortByNameDesc', sortBy: 'name', sortDirection: 'desc'}},
      {
        args: {
          testIdentifier: 'sortByNumberProductsAsc', sortBy: 'products_count', sortDirection: 'asc', isFloat: true,
        },
      },
      {
        args: {
          testIdentifier: 'sortByNumberProductsDesc', sortBy: 'products_count', sortDirection: 'desc', isFloat: true,
        },
      },
      {args: {testIdentifier: 'sortByEnabledAsc', sortBy: 'active', sortDirection: 'asc'}},
      {args: {testIdentifier: 'sortByEnabledDesc', sortBy: 'active', sortDirection: 'desc'}},
      {
        args: {
          testIdentifier: 'sortByIdAsc', sortBy: 'id_supplier', sortDirection: 'asc', isFloat: true,
        },
      },
    ];

    brandsTests.forEach((test) => {
      it(
        `should sort suppliers by '${test.args.sortBy}' '${test.args.sortDirection}' And check result`,
        async function () {
          await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

          const nonSortedTable = await suppliersPage.getAllRowsColumnContent(page, test.args.sortBy);

          await suppliersPage.sortTable(page, test.args.sortBy, test.args.sortDirection);

          const sortedTable = await suppliersPage.getAllRowsColumnContent(page, test.args.sortBy);

          if (test.args.isFloat) {
            const nonSortedTableFloat: number[] = nonSortedTable.map((text: string): number => parseFloat(text));
            const sortedTableFloat: number[] = sortedTable.map((text: string): number => parseFloat(text));

            const expectedResult: number[] = await utilsCore.sortArrayNumber(nonSortedTableFloat);

            if (test.args.sortDirection === 'asc') {
              expect(sortedTableFloat).to.deep.equal(expectedResult);
            } else {
              expect(sortedTableFloat).to.deep.equal(expectedResult.reverse());
            }
          } else {
            const expectedResult: string[] = await utilsCore.sortArray(nonSortedTable);

            if (test.args.sortDirection === 'asc') {
              expect(sortedTable).to.deep.equal(expectedResult);
            } else {
              expect(sortedTable).to.deep.equal(expectedResult.reverse());
            }
          }
        },
      );
    });
  });

  // 4: Enable, disable and delete with bulk actions
  describe('Bulk enable, disable and delete suppliers', async () => {
    it('should filter list by name', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterToBulkDelete', baseContext);

      await suppliersPage.filterTable(
        page,
        'input',
        'name',
        'todelete',
      );

      const textColumn = await suppliersPage.getTextColumnFromTableSupplier(page, 1, 'name');
      expect(textColumn).to.contains('todelete');
    });

    [
      {args: {action: 'disable', enabledValue: false}},
      {args: {action: 'enable', enabledValue: true}},
    ].forEach((test) => {
      it(`should bulk ${test.args.action} suppliers`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `bulk${test.args.action}Suppliers`, baseContext);

        const disableTextResult = await suppliersPage.bulkSetStatus(page, test.args.enabledValue);

        expect(disableTextResult).to.be.equal(suppliersPage.successfulUpdateStatusMessage);

        // Check that element in grid are disabled
        const numberOfSuppliersInGrid = await suppliersPage.getNumberOfElementInGrid(page);
        expect(numberOfSuppliersInGrid).to.be.at.most(11);

        for (let i = 1; i <= numberOfSuppliersInGrid; i++) {
          const supplierStatus = await suppliersPage.getStatus(page, i);
          expect(supplierStatus).to.equal(test.args.enabledValue);
        }
      });
    });

    it('should bulk delete suppliers', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'bulkDeleteSuppliers', baseContext);

      const deleteTextResult = await suppliersPage.deleteWithBulkActions(page);
      expect(deleteTextResult).to.be.equal(suppliersPage.successfulMultiDeleteMessage);
    });

    it('should reset filter', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterAfterBulkDelete', baseContext);

      const numberOfSuppliersAfterReset = await suppliersPage.resetAndGetNumberOfLines(page);
      expect(numberOfSuppliersAfterReset).to.be.equal(numberOfSuppliers);
    });
  });
});
