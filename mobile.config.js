const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1';
const pathToChromeProfile = 'C:/Users/viktar.hushchynski/AppData/Local/Google/Chrome/User Data/BING';

exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['mobile.search.js'],
  allScriptsTimeout: 50000,
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': [
        'user-agent=' + userAgent,
        'user-data-dir=' + pathToChromeProfile
      ]
    }
  }
};