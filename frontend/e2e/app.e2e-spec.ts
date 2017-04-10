import { EpicenterPage } from './app.po';

describe('epicenter App', () => {
    let page: EpicenterPage;

    beforeEach(() => {
        page = new EpicenterPage();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toEqual('app works!');
    });
});
