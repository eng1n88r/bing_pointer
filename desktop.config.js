////LINUX:
// const pathToChromeProfile = '/home/user/.config/chromium/Default/BING';

////WINDOWS
const pathToChromeProfile = 'C:/Users/exbarboss/AppData/Local/Microsoft/Edge/User Data/Default';
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62';

exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['desktop.search.js'],
    allScriptsTimeout: 50000,
    // capabilities: {
    //     'browserName': 'MicrosoftEdge',
    //     'chromeOptions': {
    //         'args': [
    //             'user-agent=' + userAgent,
    //             'user-data-dir=' + pathToChromeProfile
    //         ]
    //     }
    // }
};