// Import utils
import testContext from '@utils/testContext';

// Import pages
import attributesPage from '@pages/BO/catalog/attributes';
import viewAttributePage from '@pages/BO/catalog/attributes/view';

import {expect} from 'chai';
import {
  boDashboardPage,
  boLoginPage,
  type BrowserContext,
  dataAttributes,
  type Page,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_catalog_attributesAndFeatures_attributes_values_filterValues';

/*
Go to Attributes & Features page
Go to view attribute 'Color' page
Filter values table by ID, Name and Position
 */
describe('BO - Catalog - Attributes & Features : Filter attribute values table', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let numberOfValues: number = 0;

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

  it('should go to \'Catalog > Attributes & Features\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAttributesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.attributesAndFeaturesLink,
    );
    await attributesPage.closeSfToolBar(page);

    const pageTitle = await attributesPage.getPageTitle(page);
    expect(pageTitle).to.contains(attributesPage.pageTitle);
  });

  it('should filter attributes table by name \'Color\'', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'filterAttributes', baseContext);

    await attributesPage.filterTable(page, 'name', dataAttributes.color.name);

    const textColumn = await attributesPage.getTextColumn(page, 1, 'name');
    expect(textColumn).to.contains(dataAttributes.color.name);
  });

  it('should view attribute', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'viewAttribute', baseContext);

    await attributesPage.viewAttribute(page, 1);

    const pageTitle = await viewAttributePage.getPageTitle(page);
    expect(pageTitle).to.equal(viewAttributePage.pageTitle(dataAttributes.color.name));
  });

  it('should reset all filters and get number of values in BO', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFilterFirst', baseContext);

    numberOfValues = await viewAttributePage.resetAndGetNumberOfLines(page);
    expect(numberOfValues).to.be.above(0);
  });

  describe('Filter values table', async () => {
    const tests = [
      {
        args:
          {
            testIdentifier: 'filterId',
            filterBy: 'id_attribute',
            filterValue: dataAttributes.color.values[13].id.toString(),
          },
      },
      {
        args:
          {
            testIdentifier: 'filterName',
            filterBy: 'name',
            filterValue: dataAttributes.color.values[3].value,
          },
      },
      {
        args:
          {
            testIdentifier: 'filterColor',
            filterBy: 'color',
            filterValue: dataAttributes.color.values[7].color,
          },
      },
    ];

    tests.forEach((test) => {
      it(`should filter by ${test.args.filterBy} '${test.args.filterValue}'`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

        await viewAttributePage.filterTable(
          page,
          test.args.filterBy,
          test.args.filterValue,
        );

        const numberOfValuesAfterFilter = await viewAttributePage.getNumberOfElementInGrid(page);
        expect(numberOfValuesAfterFilter).to.be.at.most(numberOfValues);

        const textColumn = await viewAttributePage.getTextColumn(page, 1, test.args.filterBy);
        expect(textColumn).to.contains(test.args.filterValue);
      });

      it('should reset all filters', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.testIdentifier}Reset`, baseContext);

        const numberOfValuesAfterReset = await viewAttributePage.resetAndGetNumberOfLines(page);
        expect(numberOfValuesAfterReset).to.equal(numberOfValues);
      });
    });
  });
});
