const pathToChromeProfile = 'C:/Users/viktar.hushchynski/AppData/Local/Google/Chrome/User Data/BING';

exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['desktop.search.js'],
    allScriptsTimeout: 50000,
    capabilities: {
        'browserName': 'chrome',
        'chromeOptions': {
            'args': ['user-data-dir=' + pathToChromeProfile]
        }
    }
};