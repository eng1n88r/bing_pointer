webdriver-manager update
Start-Job -ScriptBlock {webdriver-manager start --edge "MicrosoftWebDriver.exe"}
protractor e:\work\hub\bing_pointer\desktop.config.js
protractor e:\work\hub\bing_pointer\mobile.config.js
webdriver-manager shutdown