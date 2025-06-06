const path = require("path");
const fs = require("fs");
const exec = require('child_process').exec;
const { app, BrowserWindow, powerMonitor, Tray, Menu, ipcMain, shell } = require("electron");
const DataFolder = path.join(__dirname, "..", "data");
const ModuleFolder = path.join(__dirname, "..", "mods");

// MUI
const mui = require("tera-toolbox-mui").DefaultInstance;

function InitializeMUI(language) {
	const { InitializeDefaultInstance } = require("tera-toolbox-mui");
	InitializeDefaultInstance(language);
}

// Configuration
function LoadConfiguration() {
	try {
		return require("./config").loadConfig();
	} catch (_) {
		const { dialog } = require("electron");

		dialog.showMessageBoxSync({
			"type": "error",
			"title": mui.get("loader-gui/error-config-file-corrupt/title"),
			"message": mui.get("loader-gui/error-config-file-corrupt/message", { "supportUrl": global.TeraProxy.SupportUrl })
		});

		app.exit();
	}
}

function SaveConfiguration(newConfig) {
	global.TeraProxy.DevMode = !!newConfig.devmode;
	global.TeraProxy.GUITheme = newConfig.gui.theme;

	InitializeMUI(newConfig.uilanguage);

	require("./config").saveConfig(newConfig);
}

// Migration
function Migration() {
	try {
		const { ToolboxMigration } = require("./migration");
		ToolboxMigration();
	} catch (e) {
		const { dialog } = require("electron");

		dialog.showMessageBoxSync({
			"type": "error",
			"title": mui.get("loader-gui/error-migration-failed/title"),
			"message": mui.get("loader-gui/error-migration-failed/message", { "supportUrl": global.TeraProxy.SupportUrl })
		});

		app.exit();
	}
}

// Helper function to get display name with HTML formatting
function displayName(modInfo) {
    if (modInfo.options) {
        if (modInfo.options.guiName)
            return modInfo.options.guiName;
        if (modInfo.options.cliName)
            return modInfo.options.cliName;
    }
    return modInfo.rawName || modInfo.name;
}

// Installed mod management
let AvailableModuleListUrl = "https://raw.githubusercontent.com/merusira/moduleLists/master/moduleList-3104.json";
const { listModuleInfos, installModule, uninstallModule, toggleAutoUpdate, toggleLoad } = require("tera-mod-management");

let CachedAvailableModuleList = null;
async function getInstallableMods(forceRefresh = false) {
	// Update module list URL based on current patch version
	if (config.patchVersion === '100.02 Starscape') {
		AvailableModuleListUrl = 'https://raw.githubusercontent.com/merusira/moduleLists/master/moduleList-10002.json';
	} else {
		AvailableModuleListUrl = 'https://raw.githubusercontent.com/merusira/moduleLists/master/moduleList-3104.json';
	}

	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}

	// (Re)download list of all available modules if required
	if (!CachedAvailableModuleList || forceRefresh) {
		const { fetchWithPooling } = require("./utils/http-client");
		try {
			CachedAvailableModuleList = await (await fetchWithPooling(AvailableModuleListUrl)).json();
		} catch (e) {
			showError(e.toString());
			return [];
		}
	}

	// Filter out already installed mods
	const installedModInfos = listModuleInfos(modFolder);
	return CachedAvailableModuleList.filter(modInfo => !installedModInfos.some(installedModInfo => installedModInfo.name === modInfo.name.toLowerCase()));
}

// Proxy Main
let proxy = null;
let proxyRunning = false;
function _StartProxy(ModuleFolder, ProxyConfig) {
	if (proxy || proxyRunning)
		return false;

	const TeraProxy = require("./proxy");
	proxy = new TeraProxy(ModuleFolder, DataFolder, ProxyConfig);
	try {
		// Switch to highest process priority so we don't starve because of game client using all CPU
		const { setHighestProcessPriority } = require("./utils");
		setHighestProcessPriority();

		// Start proxy
		proxy.run();
		proxyRunning = true;
		return true;
	} catch (_) {
		console.error(mui.get("loader-gui/error-cannot-start-proxy"));
		proxy = null;
		proxyRunning = false;
		return false;
	}
}

async function StartProxy(moduleFolder, ProxyConfig) {
	if (proxy || proxyRunning)
		return false;
		
	// Get the appropriate mod folder based on the current patch version
	let modFolder = moduleFolder;
	if (ProxyConfig.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(moduleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			//console.log(`Fixing nested patch100 folders in mod folder path: ${modFolder}`);
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}

	if (ProxyConfig.noupdate) {
		console.warn(mui.get("loader-gui/warning-noupdate-1"));
		console.warn(mui.get("loader-gui/warning-noupdate-2"));
		console.warn(mui.get("loader-gui/warning-noupdate-3"));
		console.warn(mui.get("loader-gui/warning-noupdate-4"));
		console.warn(mui.get("loader-gui/warning-noupdate-5"));
	} else {
		const autoUpdate = require("./update");

		try {
			// Make sure the mod folder exists
			if (!fs.existsSync(modFolder)) {
				console.log(`Creating mod folder: ${modFolder}`);
				fs.mkdirSync(modFolder, { recursive: true });
			}
			
			const updateResult = await autoUpdate(modFolder, ProxyConfig.updatelog, true);
			updateResult.legacy.forEach(mod => console.warn(mui.get("loader-gui/warning-update-mod-not-supported", { "name": mod.name })));
			updateResult.failed.forEach(mod => console.error(mui.get("loader-gui/error-update-mod-failed", { "name": mod.name })));
		} catch (e) {
			console.error(mui.get("loader-gui/error-update-failed"));
			console.error(e);
		}
	}

	return _StartProxy(modFolder, ProxyConfig);
}

async function StopProxy() {
	if (!proxy || !proxyRunning)
		return false;

	// Stop proxy
	proxy.destructor();
	proxy = null;
	proxyRunning = false;

	// Switch back to normal process priority
	const { setNormalProcessPriority } = require("./utils");
	setNormalProcessPriority();

	return true;
}

// Periodic update check
let UpdateCheckInterval = null;
let UpdateChecker = null;
function startUpdateCheck(branch, onUpdateAvailable, interval = 30 * 60 * 1000) {
	if (UpdateCheckInterval || UpdateChecker)
		return;

	const Updater = require("./update-self");
	UpdateChecker = new Updater(branch);

	UpdateCheckInterval = setInterval(async () => {
		try {
			const CheckResult = await UpdateChecker.check();
			if (CheckResult && CheckResult.operations && CheckResult.operations.length > 0)
				onUpdateAvailable();
		} catch (_) {
			// Ignore
		}
	}, interval);
}

function stopUpdateCheck() {
	clearInterval(UpdateCheckInterval);
	UpdateCheckInterval = null;
	UpdateChecker = null;
}

// Clean exit
const isWindows = process.platform === "win32";

function cleanExit() {
	console.log(mui.get("loader-gui/terminating"));

	// Clean up HTTP/HTTPS connections
	const { cleanupConnections } = require("./utils/http-client");
	cleanupConnections();

	StopProxy().then(() => {
		if (isWindows)
			process.stdin.pause();
	});
}

if (isWindows) {
	require("readline").createInterface({
		"input": process.stdin,
		"output": process.stdout
	}).on("SIGINT", () => process.emit("SIGINT"));
}

process.on("SIGHUP", cleanExit);
process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

// IPC
ipcMain.on("init", (event, _) => {
	event.sender.send("set config", config);
	event.sender.send("proxy running", false);
	event.sender.send("is admin", global.TeraProxy.IsAdmin);

	if (config.noselfupdate) {
		console.warn(mui.get("loader-gui/warning-noselfupdate-1"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-2"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-3"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-4"));
		console.warn(mui.get("loader-gui/warning-noselfupdate-5"));
	}

	if (config.gui.autostart) {
		event.sender.send("proxy starting");
		console.log(mui.get("loader-gui/proxy-starting"));
		
		// Get the appropriate mod folder based on the current patch version
		let modFolder = ModuleFolder;
		if (config.patchVersion === '100.02 Starscape') {
			modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
			
			// Fix nested patch100 folders in modFolder
			if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
				modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
				modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
			}
		}
		
		StartProxy(modFolder, config).then((result) => {
			event.sender.send("proxy running", result);
		});
	}
});

ipcMain.on("start proxy", (event, _) => {
	if (proxy || proxyRunning)
		return;

	event.sender.send("proxy starting");
	console.log(mui.get("loader-gui/proxy-starting"));
	
	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}
	
	StartProxy(modFolder, config).then((result) => {
		event.sender.send("proxy running", result);
	});
});

ipcMain.on("stop proxy", (event, _) => {
	if (!proxy || !proxyRunning)
		return;

	console.log(mui.get("loader-gui/proxy-stopping"));
	StopProxy().then(() => {
		event.sender.send("proxy running", false);
		console.log(mui.get("loader-gui/proxy-stopped"));
	});
});

ipcMain.on("get config", (event, _) => {
	event.sender.send("set config", config);
});

ipcMain.on("set config", (_, newConfig) => {
	config = newConfig;
	SaveConfiguration(config);
});

ipcMain.on("get mods", (event, _) => {
	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}
	
	event.sender.send("set mods", listModuleInfos(modFolder));
});

// Add IPC handler for patch switching
ipcMain.on("switch patch", (event, patchVersion) => {
	// Always clear cached module list to force refresh when switching patches
	CachedAvailableModuleList = null;
	
	// Print a message to the console log indicating which patch is selected
	console.log(`===== PATCH SELECTED: ${patchVersion} =====`);
	
	if (proxy && proxyRunning) {
		// If proxy is running, switch patch dynamically
		console.log(mui.get("loader-gui/switching-patch", { patchVersion }) || `Switching to Patch ${patchVersion}...`);
		
		try {
			proxy.switchPatch(patchVersion).then(() => {
				console.log(mui.get("loader-gui/patch-switched", { patchVersion }) || `Successfully switched to Patch ${patchVersion}`);
				//console.log(`Now using ${patchVersion === '100.02 Starscape' ? 'patch100/data' : 'data'} folder for game data`);
				//console.log(`Now using ${patchVersion === '100.02 Starscape' ? 'patch100/mods' : 'mods'} folder for game mods`);
				
				// Refresh mod lists
				event.sender.send("set config", config);
				event.sender.send("get mods");
				event.sender.send("get installable mods");
			}).catch(err => {
				console.error(mui.get("loader-gui/error-switching-patch", { error: err.message }) || `Error switching to Patch ${patchVersion}: ${err.message}`);
				event.sender.send("error", mui.get("loader-gui/error-switching-patch", { error: err.message }) || `Error switching to Patch ${patchVersion}: ${err.message}`);
			});
		} catch (err) {
			console.error(mui.get("loader-gui/error-switching-patch", { error: err.message }) || `Error switching to Patch ${patchVersion}: ${err.message}`);
			event.sender.send("error", mui.get("loader-gui/error-switching-patch", { error: err.message }) || `Error switching to Patch ${patchVersion}: ${err.message}`);
		}
	} else {
		// If proxy is not running, just update the config
		config.patchVersion = patchVersion;
		SaveConfiguration(config);
		
		// Print information about which folders will be used
		//console.log(`Now using ${patchVersion === '100.02 Starscape' ? 'patch100/data' : 'data'} folder for game data`);
		//console.log(`Now using ${patchVersion === '100.02 Starscape' ? 'patch100/mods' : 'mods'} folder for game mods`);
		
		// Refresh mod lists
		event.sender.send("set config", config);
		event.sender.send("get mods");
		event.sender.send("get installable mods");
	}
});

ipcMain.on("get installable mods", (event, _) => {
	// Always clear the cache to force a refresh
	CachedAvailableModuleList = null;
	getInstallableMods(true).then(mods => event.sender.send("set installable mods", mods));
});

ipcMain.on("install mod", (event, modInfo) => {
	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}
	
	installModule(modFolder, modInfo);
	console.log(mui.get("loader-gui/mod-installed", { "name": displayName(modInfo) }));
	getInstallableMods().then(mods => event.sender.send("set installable mods", mods));
});

ipcMain.on("toggle mod load", (event, modInfo) => {
	toggleLoad(modInfo);
	console.log(mui.get("loader-gui/mod-load-toggled", { "enabled": modInfo.disabled, "name": displayName(modInfo) }));
	
	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}
	
	event.sender.send("set mods", listModuleInfos(modFolder));
});

ipcMain.on("toggle mod autoupdate", (event, modInfo) => {
	toggleAutoUpdate(modInfo);
	console.log(mui.get("loader-gui/mod-updates-toggled", { "updatesEnabled": modInfo.disableAutoUpdate, "name": displayName(modInfo) }));
	
	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}
	
	event.sender.send("set mods", listModuleInfos(modFolder));
});

ipcMain.on("uninstall mod", (event, modInfo) => {
	uninstallModule(modInfo);
	console.log(mui.get("loader-gui/mod-uninstalled", { "name": displayName(modInfo) }));
	
	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
		
		// Fix nested patch100 folders in modFolder
		if (modFolder.includes('patch100\\patch100') || modFolder.includes('patch100/patch100')) {
			modFolder = modFolder.replace(/patch100[\/\\]patch100[\/\\]patch100/g, 'patch100');
			modFolder = modFolder.replace(/patch100[\/\\]patch100/g, 'patch100');
		}
	}
	
	event.sender.send("set mods", listModuleInfos(modFolder));
});

ipcMain.on("show mods folder", () => {
	// Get the appropriate mod folder based on the current patch version
	let modFolder = ModuleFolder;
	if (config.patchVersion === '100.02 Starscape') {
		modFolder = path.join(path.dirname(ModuleFolder), 'patch100', 'mods');
	}
	
	shell.openPath(modFolder);
});

ipcMain.on("open in notepad", (event, str) => {
	exec(`notepad "${str}"`)
});

// Add handler for exit application
ipcMain.on("exit application", () => {
	// Set the isQuitting flag to ensure the app exits properly
	app.isQuitting = true;
	
	// Close the application
	if (gui && gui.window) {
		gui.close();
	} else {
		app.exit();
	}
});

// GUI
class TeraProxyGUI {
	constructor() {
		this.window = null;
		this.tray = null;
	}

	show() {
		if (this.window !== null) {
			this.window.show();
			if (this.window.isMinimized()) {
				this.window.restore();
			}
			this.window.focus();
			return;
		}

		// Migration
		Migration();

		// Load configuration
		config = LoadConfiguration();
		InitializeMUI(config.uilanguage);

		global.TeraProxy.GUIMode = true;
		global.TeraProxy.DevMode = !!config.devmode;

		if (!config.gui) {
			config.gui = {
				enabled: true,
				theme: "black",
				autostart: false,
				logtimes: true,
				width: 880,
				height: 500,
				maximized: false
			};

			SaveConfiguration(config);
		} else {
			if (config.gui.logtimes === undefined) {
				config.gui.logtimes = true;
				SaveConfiguration(config);
			}

			global.TeraProxy.GUITheme = config.gui.theme || "black";
		}

		// Initialize main window
		const guiRoot = path.join(__dirname, "gui");
		const guiIcon = path.join(guiRoot, "/assets/icon.ico")
		this.window = new BrowserWindow({
			title: "TeraAtlas",
			width: config?.gui?.width || 743,
			height: config?.gui?.height || 514,
			minWidth: 743,
			minHeight: 514,
			icon: guiIcon,
			frame: false,
			backgroundColor: "#292F33",
			resizable: true,
			centered: true,
			show: false,
			skipTaskbar: false,
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				devTools: false,
				spellcheck: false
			}
		});
		this.window.loadFile(path.join(guiRoot, "main.html"));
		//this.window.webContents.openDevTools();

		this.window.once("ready-to-show", () => {
			this.window.show();
			if (config?.gui?.maximized) this.window.maximize();
		});

		this.window.on("close", (event) => {
			// Save window size and position
			config.gui.maximized = this.window.isMaximized();
			if (!config.gui.maximized)
			{
				const size = this.window.getSize();
				config.gui.width = size[0];
				config.gui.height = size[1];
			}
			SaveConfiguration(config);

			return true;
		});
		this.window.on('minimize', (event) => {
			// Explicitly minimize the window instead of hiding it
			// This ensures it stays in the taskbar when minimized
			if (this.window) {
				this.window.minimize();
			}
		});
		
		this.window.on("closed", () => { StopProxy(); this.window = null; });
		
		// Initialize tray icon
		try {
			this.tray = new Tray(guiIcon);
			this.tray.setToolTip("TeraAtlas - Left-click to show/hide, Right-click for menu");
			
			// Create context menu template
			const contextMenu = Menu.buildFromTemplate([
				{
					label: "Show/Hide Window",
					click: () => {
						if (this.window) {
							if (this.window.isVisible()) {
								this.window.hide();
							} else {
								this.showFromTray();
							}
						}
					}
				},
				{
					type: "separator"
				},
				{
					label: "Exit",
					click: () => {
						// Set a flag to indicate we're quitting
						app.isQuitting = true;
						
						// Destroy the tray icon first
						if (this.tray) {
							this.tray.destroy();
							this.tray = null;
						}
						
						// Stop the proxy if it's running
						if (proxy && proxyRunning) {
							StopProxy().then(() => {
								if (this.window) {
									this.window.destroy();
								}
								setTimeout(() => app.exit(), 100);
							});
						} else {
							if (this.window) {
								this.window.destroy();
							}
							setTimeout(() => app.exit(), 100);
						}
					}
				}
			]);
			
			// Set the context menu
			this.tray.setContextMenu(contextMenu);
			
			// Add click handler
			this.tray.on("click", () => {
				// Toggle window visibility on left click
				if (this.window) {
					if (this.window.isVisible()) {
						this.window.hide();
					} else {
						this.showFromTray();
					}
				}
			});
		} catch (e) {
			console.error("Error setting up tray icon:", e);
		}

		// Redirect console to built-in one
		const nodeConsole = require("console");
		console = new nodeConsole.Console(process.stdout, process.stderr);

		const old_stdout = process.stdout.write;
		process.stdout.write = function (msg, ...args) {
			old_stdout(msg, ...args);
			log(msg, "log");
		};
		const old_stderr = process.stderr.write;
		process.stderr.write = function (msg, ...args) {
			old_stderr(msg, ...args);
			if(msg.startsWith("warn:"))
				log(msg.replace("warn:", ""), "warn");
			else 
				log(msg, "error");
		};

		// Start periodic update check
		if (!config.noselfupdate) {
			startUpdateCheck((config.branch || "master").toLowerCase(), () => {
				if (this.window)
					this.window.webContents.send("update available");
			});
		}

		powerMonitor.on('suspend', () => {
			if (this.window) {
				if (!proxy || !proxyRunning)
					return;

				console.log(mui.get("loader-gui/proxy-stopping"));
				
				StopProxy().then(() => {
					this.window.webContents.send("proxy running", false);
					console.log(mui.get("loader-gui/proxy-stopped"));
				});

			}
		});
	}

	hide() {
		if (this.window !== null)
			this.window.hide();
	}

	showFromTray() {
		if (this.window !== null) {
			try {
				// Try multiple approaches to ensure the window is shown
				if (this.window.isMinimized()) {
					this.window.restore();
				}
				
				if (!this.window.isVisible()) {
					this.window.show();
				}
				
				this.window.focus();
			} catch (e) {
				console.error("Error in showFromTray:", e);
			}
		} else {
			// If window doesn't exist, call the show method to create it
			this.show();
		}
	}

	close() {
		if (this.window !== null) {
			// Set the isQuitting flag to ensure the app exits properly
			app.isQuitting = true;
			
			try {
				stopUpdateCheck();
				
				// Destroy the tray icon first to prevent it from lingering
				if (this.tray) {
					this.tray.destroy();
					this.tray = null;
				}
				
				// Stop the proxy if it's running
				if (proxy && proxyRunning) {
					StopProxy().then(() => {
						// Clean up HTTP/HTTPS connections
						try {
							const { cleanupConnections } = require("./utils/http-client");
							cleanupConnections();
						} catch (e) {
							console.error("Error cleaning up connections:", e);
						}
						
						// Use destroy instead of close to bypass the close event handler
						if (this.window) {
							this.window.destroy();
							this.window = null;
						}
						
						setTimeout(() => app.exit(), 100);
					});
				} else {
					// Clean up HTTP/HTTPS connections
					try {
						const { cleanupConnections } = require("./utils/http-client");
						cleanupConnections();
					} catch (e) {
						console.error("Error cleaning up connections:", e);
					}
					
					// Use destroy instead of close to bypass the close event handler
					if (this.window) {
						this.window.destroy();
						this.window = null;
					}
					
					setTimeout(() => app.exit(), 100);
				}
			} catch (e) {
				console.error("Error in close method:", e);
				// Force exit as a last resort
				app.exit(1);
			}
		}
	}

	showError(error) {
		if (this.window)
			this.window.webContents.send("error", error);
	}

	log(msg, type = "log") {
		if (this.window)
			this.window.webContents.send("log", msg, type);
	}
}

// Main
let gui;
let config;

function showError(error) {
	console.error(error);
	if (gui)
		gui.showError(error);
}

function log(msg, type = "log") {
	if (msg.length === 0)
		return;

	if (gui)
		gui.log(msg, type);
}

process.on("warning", (warning) => {
	console.warn(warning.name);
	console.warn(warning.message);
	console.warn(warning.stack);
});

module.exports = function StartGUI() {
	return new Promise((resolve, reject) => {
		const { initGlobalSettings } = require("./utils");
		initGlobalSettings(false).then(() => {
			// Boot GUI
			gui = new TeraProxyGUI;

			if (app.isReady()) {
				gui.show();
				resolve();
			} else {
				app.on("ready", () => {
					gui.show();
					resolve();
				});
			}

			app.on("second-instance", () => {
				if (gui)
					gui.show();
			});

			// Set isQuitting flag when app is about to quit
			app.on("before-quit", () => {
				app.isQuitting = true;
			});

			app.on("window-all-closed", () => {
				if (process.platform !== "darwin")
					app.quit();
			});

			app.on("activate", () => {
				gui.show();
			});
		});
	});
};
