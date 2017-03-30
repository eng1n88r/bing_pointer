webdriver-manager update
Start-Job -ScriptBlock {webdriver-manager start}
protractor e:\personal\hub\bing_points\desktop.config.js
protractor e:\personal\hub\bing_points\mobile.config.js
webdriver-manager shutdown