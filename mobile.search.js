describe('bing mobile search', function () {
    const NUMBER_OF_SEARCHES = 100;
    const WORD_COMPLEXITY = 5;

    const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

    for (var i = 0; i < NUMBER_OF_SEARCHES; i++) {
        var word = "";

        for (var k = 0; k < WORD_COMPLEXITY; k++) {
            var index = Math.floor((Math.random() * 26) + 1);
            word += arr[index];
        }

        (function (index, text) {
            it('should search something', function (done) {
                browser.ignoreSynchronization = true;
                browser.get('https://bing.com');

                element(by.id('sb_form_q')).clear();
                element(by.id('sb_form_q')).sendKeys(text + ' ' + Math.random() * 10000);
                element(by.id('sbBtn')).click();
                expect(index).toBe(index);
                setTimeout(done, 1);
            });
        })(i, word);
    }
});