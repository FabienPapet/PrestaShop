// Import utils
import testContext from '@utils/testContext';

// Import pages
import {
  boCurrenciesPage,
  boCurrenciesCreatePage,
  boDashboardPage,
  boLocalizationPage,
  boLoginPage,
  dataCurrencies,
  type FakerCurrency,
  utilsCore,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

import {expect} from 'chai';
import type {BrowserContext, Page} from 'playwright';

const baseContext: string = 'functional_BO_international_localization_currencies_filterSortAndPagination';

/*
Create 10 official currencies
Filter currencies by: ID, currency, symbol, iso code, enabled
Pagination next and previous
Sort currencies by : ID, iso code, exchange rate, enabled
Delete the created currencies
 */
describe('BO - International - Currencies : Filter, sort and pagination', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let numberOfCurrencies: number = 0;

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

  it('should go to \'International > Localization\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToLocalizationPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.internationalParentLink,
      boDashboardPage.localizationLink,
    );
    await boLocalizationPage.closeSfToolBar(page);

    const pageTitle = await boLocalizationPage.getPageTitle(page);
    expect(pageTitle).to.contains(boLocalizationPage.pageTitle);
  });

  it('should go to \'Currencies\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCurrenciesPage', baseContext);

    await boLocalizationPage.goToSubTabCurrencies(page);

    const pageTitle = await boCurrenciesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boCurrenciesPage.pageTitle);
  });

  it('should reset all filters', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFilterFirst', baseContext);

    numberOfCurrencies = await boCurrenciesPage.resetAndGetNumberOfLines(page);
    expect(numberOfCurrencies).to.be.above(0);
  });

  const currencies: FakerCurrency[] = [
    dataCurrencies.mad, dataCurrencies.all, dataCurrencies.chileanPeso, dataCurrencies.dzd, dataCurrencies.tnd,
    dataCurrencies.try, dataCurrencies.usd, dataCurrencies.aed, dataCurrencies.lyd, dataCurrencies.lsl,
  ];

  // 1 - Create 10 currencies
  currencies.forEach((currency: FakerCurrency, index: number) => {
    describe(`Create official currency '${currency.name}'`, async () => {
      it('should go to create new currency page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToAddNewCurrencyPage${index}`, baseContext);

        await boCurrenciesPage.goToAddNewCurrencyPage(page);

        const pageTitle = await boCurrenciesCreatePage.getPageTitle(page);
        expect(pageTitle).to.contains(boCurrenciesCreatePage.pageTitle);
      });

      it('should create currency', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `createOfficialCurrency${index}`, baseContext);

        // Create and check successful message
        const textResult = await boCurrenciesCreatePage.addOfficialCurrency(page, currency);
        expect(textResult).to.contains(boCurrenciesPage.successfulCreationMessage);

        // Check number of currencies after creation
        const numberOfCurrenciesAfterCreation = await boCurrenciesPage.resetAndGetNumberOfLines(page);
        expect(numberOfCurrenciesAfterCreation).to.be.equal(numberOfCurrencies + 1 + index);
      });
    });
  });

  // 2 - Filter currencies table
  describe('Filter currencies', async () => {
    [
      {
        args:
          {
            testIdentifier: 'filterById',
            filterType: 'input',
            filterBy: 'id_currency',
            filterValue: '1',
          },
      },
      {
        args:
          {
            testIdentifier: 'filterByName',
            filterType: 'input',
            filterBy: 'name',
            filterValue: dataCurrencies.all.name,
          },
      },
      {
        args:
          {
            testIdentifier: 'filterBySymbol',
            filterType: 'input',
            filterBy: 'symbol',
            filterValue: dataCurrencies.all.symbol,
          },

      },
      {
        args:
          {
            testIdentifier: 'filterByIsoCode',
            filterType: 'input',
            filterBy: 'iso_code',
            filterValue: dataCurrencies.all.isoCode,
          },
      },
      {
        args:
          {
            testIdentifier: 'filterByEnabled',
            filterType: 'select',
            filterBy: 'active',
            filterValue: dataCurrencies.all.enabled ? '1' : '0',
          },
      },
    ].forEach((test, index: number) => {
      it(`should filter by ${test.args.filterBy} '${test.args.filterValue}'`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

        // Filter
        await boCurrenciesPage.filterTable(
          page,
          test.args.filterType,
          test.args.filterBy,
          test.args.filterValue,
        );
        if (test.args.filterBy === 'active') {
          const currencyStatus = await boCurrenciesPage.getStatus(page, 1);
          expect(currencyStatus).to.be.equal(test.args.filterValue === '1');
        } else {
          const currency = await boCurrenciesPage.getTextColumnFromTableCurrency(page, 1, test.args.filterBy);
          expect(currency).to.contains(test.args.filterValue);
        }

        // Check number of currencies
        const numberOfCurrenciesAfterFilter = await boCurrenciesPage.getNumberOfElementInGrid(page);
        expect(numberOfCurrenciesAfterFilter).to.be.most(numberOfCurrencies + 10);
      });

      it('should reset filter', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `resetFilter${index}`, baseContext);

        const numberOfCurrenciesAfterReset = await boCurrenciesPage.resetAndGetNumberOfLines(page);
        expect(numberOfCurrenciesAfterReset).to.be.equal(numberOfCurrencies + 10);
      });
    });
  });

  // 3 : Pagination
  describe('Pagination next and previous', async () => {
    it('should change the item number to 10 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemNumberTo10', baseContext);

      const paginationNumber = await boCurrenciesPage.selectPaginationLimit(page, 10);
      expect(paginationNumber).to.contains('(page 1 / 2)');
    });

    it('should click on next', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNext', baseContext);

      const paginationNumber = await boCurrenciesPage.paginationNext(page);
      expect(paginationNumber).to.contains('(page 2 / 2)');
    });

    it('should click on previous', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnPrevious', baseContext);

      const paginationNumber = await boCurrenciesPage.paginationPrevious(page);
      expect(paginationNumber).to.contains('(page 1 / 2)');
    });

    it('should change the item number to 50 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemNumberTo50', baseContext);

      const paginationNumber = await boCurrenciesPage.selectPaginationLimit(page, 50);
      expect(paginationNumber).to.contains('(page 1 / 1)');
    });
  });

  // 4 : Sort table
  describe('Sort currencies table', async () => {
    const tests = [
      {
        args: {
          testIdentifier: 'sortByIdDesc', sortBy: 'id_currency', sortDirection: 'desc', isFloat: true,
        },
      },
      {args: {testIdentifier: 'sortByIsoCodeAsc', sortBy: 'iso_code', sortDirection: 'asc'}},
      {args: {testIdentifier: 'sortByIsoCodeDesc', sortBy: 'iso_code', sortDirection: 'desc'}},
      {
        args: {
          testIdentifier: 'sortByExchangeRateAsc', sortBy: 'conversion_rate', sortDirection: 'asc', isFloat: true,
        },
      },
      {
        args: {
          testIdentifier: 'sortByExchangeRateDesc', sortBy: 'conversion_rate', sortDirection: 'desc', isFloat: true,
        },
      },
      {args: {testIdentifier: 'sortByEnabledAsc', sortBy: 'active', sortDirection: 'asc'}},
      {args: {testIdentifier: 'sortByEnabledDesc', sortBy: 'active', sortDirection: 'desc'}},
      {
        args: {
          testIdentifier: 'sortByIdAsc', sortBy: 'id_currency', sortDirection: 'asc', isFloat: true,
        },
      },
    ];

    tests.forEach((test) => {
      it(`should sort by '${test.args.sortBy}' '${test.args.sortDirection}' and check result`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

        const nonSortedTable = await boCurrenciesPage.getAllRowsColumnContent(page, test.args.sortBy);

        await boCurrenciesPage.sortTable(page, test.args.sortBy, test.args.sortDirection);

        const sortedTable = await boCurrenciesPage.getAllRowsColumnContent(page, test.args.sortBy);

        if (test.args.isFloat) {
          const nonSortedTableFloat = nonSortedTable.map((text: string): number => parseFloat(text));
          const sortedTableFloat = sortedTable.map((text: string): number => parseFloat(text));

          const expectedResult = await utilsCore.sortArrayNumber(nonSortedTableFloat);

          if (test.args.sortDirection === 'asc') {
            expect(sortedTableFloat).to.deep.equal(expectedResult);
          } else {
            expect(sortedTableFloat).to.deep.equal(expectedResult.reverse());
          }
        } else {
          const expectedResult = await utilsCore.sortArray(nonSortedTable);

          if (test.args.sortDirection === 'asc') {
            expect(sortedTable).to.deep.equal(expectedResult);
          } else {
            expect(sortedTable).to.deep.equal(expectedResult.reverse());
          }
        }
      });
    });
  });

  // 4 : Delete currencies created
  describe('Delete currencies', async () => {
    currencies.forEach((currency: FakerCurrency, index: number) => {
      it(`should filter list by currency name '${currency.name}'`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `filterToDelete${index}`, baseContext);

        await boCurrenciesPage.filterTable(page, 'input', 'name', currency.name);

        const currencyName = await boCurrenciesPage.getTextColumnFromTableCurrency(page, 1, 'name');
        expect(currencyName).to.contains(currency.name);
      });

      it('should delete currency', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `deleteCurrency${index}`, baseContext);

        const result = await boCurrenciesPage.deleteCurrency(page, 1);
        expect(result).to.be.equal(boCurrenciesPage.successfulDeleteMessage);
      });

      it('should reset filter', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `resetFilterAfterDelete${index}`, baseContext);

        const numberOfCurrenciesAfterReset = await boCurrenciesPage.resetAndGetNumberOfLines(page);
        expect(numberOfCurrenciesAfterReset).to.be.equal(numberOfCurrencies + 10 - index - 1);
      });
    });
  });
});
