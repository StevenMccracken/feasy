import { PYRSUITPage } from './app.po';

describe('pyrsuit App', () => {
  let page: PYRSUITPage;

  beforeEach(() => {
    page = new PYRSUITPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
