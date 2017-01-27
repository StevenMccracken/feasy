import { EpiDashboardPage } from './app.po';

describe('epi-dashboard App', function() {
  let page: EpiDashboardPage;

  beforeEach(() => {
    page = new EpiDashboardPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
