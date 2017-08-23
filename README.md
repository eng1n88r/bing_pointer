# Bing Pointer
Protractor automated bing search for collecting daily searching points.

##Dependencies:

### JDK

* Linux:

```sh
$ sudo apt install openjdk-8-jre-headless
```
* Windows:

Install [JDK] (http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

### Node.js

* Linux:

```sh
$ sudo apt install python-software-properties
$ curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
$ sudo apt install nodejs
```

* Windows:

Install [Node.js] (https://nodejs.org/en/download/)

### Chrom(ium) browser (depending on your OS)

## How To Use:
### Linux:
In `mobile.config.js` and `desktop.config.js` uncomment the the line corresponding to your OS (you could use any custom path you want):
```javascript
const pathToChromeProfile = '/home/user/.config/chromium/Default/BING';
```

  ```sh
 $ git clone https://github.com/exbarboss/bing_pointer.git
 $ cd bing_pointer/
 $ cd node_modules/.bin/
 $ sudo ./webdriver-manager update
 $ sudo ./webdriver-manager start
 ```
 This will start the server. In another terminal window execute the following to emulate desktop search (assuming you are inside `bing_pointer/node_modules/.bin/`):
 ```sh
 $ sudo ./protractor ../../desktop.config.js
 ```
 or to emulate mobile search run:
```sh
$ sudo ./protractor ../../mobile.config.js
```
### Windows
In `mobile.config.js` and `desktop.config.js` uncomment the the line corresponding to your OS (you could use any custom path you want):
```javascript
const pathToChromeProfile = 'C:/Users/user/AppData/Local/Google/Chrome/User Data/BING';
```
 ```sh
 git clone https://github.com/exbarboss/bing_pointer.git
 cd bing_pointer/
 cd node_modules/.bin/
 webdriver-manager update
 webdriver-manager start
 ```
 This will start the server. In another cmd window execute the following to emulate desktop search (assuming you are inside `bing_pointer/node_modules/.bin/`):
 ```sh
 $ protractor PATH_TO_PROJECT:/bing_pointer/desktop.config.js
 ```
 or to emulate mobile search run:
```sh
$ protractor PATH_TO_PROJECT:/bing_pointer/mobile.config.js
```

_Add path for `webdriver` to `Path` environment variable i.e. `DRIVE:\bing_pointer\node_modules\.bin\`._

_To automate this process setup a new task in Windows Task Scheduler that will run daily:_
* On actions tab add new Action
* Program/Script: `Powershell.exe`
* Add arguments: `-ExecutionPolicy Bypass DRIVE:\bing_pointer\runner.ps1`

#### Note

_You will need to terminate `Ctrl + C` the first execution and log in with your Microsoft account to get points properly, otherwise it will not work._