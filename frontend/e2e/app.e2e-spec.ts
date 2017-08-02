import { FEASYPage } from './app.po';

describe('feasy App', () => {
  let page: FEASYPage;

  beforeEach(() => {
    page = new FEASYPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
