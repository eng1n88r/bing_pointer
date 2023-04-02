const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1';

////LINUX:
// const pathToChromeProfile = '/home/user/.config/chromium/Default/BING';

////WINDOWS
const pathToChromeProfile = 'C:/Users/exbarboss/AppData/Local/Microsoft/Edge/User Data/Default';

exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['mobile.search.js'],
  allScriptsTimeout: 50000,
  // capabilities: {
  //   'browserName': 'MicrosoftEdge',
  //   'chromeOptions': {
  //     'args': [
  //       'user-agent=' + userAgent,
  //       'user-data-dir=' + pathToChromeProfile
  //     ]
  //   }
  // }
};