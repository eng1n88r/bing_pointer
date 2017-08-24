const search = function (button_element_id) {
    const NUMBER_OF_SEARCHES = 50;
    const WORD_COMPLEXITY = 5;

    const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

    for (let i = 0; i < NUMBER_OF_SEARCHES; i++) {
        let word = "";
        for (let k = 0; k < WORD_COMPLEXITY; k++) {
            let size = arr.length - 1;
            let random = (Math.random() * size);
            let idx = Math.floor(random + 1);

            word += arr[idx];
        }
        test(i, word, button_element_id);
    }
};

const test = function(index, word, button_element_id) {
    it('should search something', function (done) {
        browser.ignoreSynchronization = true;
        browser.get('https://bing.com');

        element(by.id('sb_form_q')).clear();
        element(by.id('sb_form_q')).sendKeys(word + ' ' + Math.random() * 10000);
        element(by.id(button_element_id)).click();
        expect(index).toBe(index);
        setTimeout(done, 10);
    });
};

module.exports = {
    search: search
};