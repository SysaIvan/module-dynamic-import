'use strict';

/**
 * @module
 */

// ----------------------------------------
// Private
// ----------------------------------------

class ModuleDynamicImport {
	/**
	 * @param {ModuleDynamicImportSettings} settings
	 */
	constructor (settings) {
		/** @private */
		this._Promise = settings.Promise || null;
		if (this._Promise === null) {
			throw new Error('ModuleDynamicImport Erorr! You must specify "Promise" property!')
		}

		/** @private */
		this._selector = settings.selector || '.js-import';
		/** @private */
		this._modules = settings.modules || {};
		/** @private */
		this._pendingCssClass = settings.pendingCssClass || '_import-pending';
		/** @private */
		this._loadedCssClass = settings.loadedCssClass || '_import-loaded';
		/** @private */
		this._debug = settings.debug || false;

		/** @private */
		this._promises = {};
		this._setPromises();
	}

	/**
	 * @private
	 */
	_moduleSelectors () {
		for (let moduleSelector in this._modules) {
			if (this._modules.hasOwnProperty(moduleSelector)) {
				let selectors = this._modules[moduleSelector];
				if (Array.isArray(selectors)) {
					this._modules[moduleSelector] = selectors.join(',');
				}
			}
		}
	}

	/**
	 * @private
	 */
	_setPromises () {
		this._moduleSelectors();
		for (let moduleName in this._modules) {
			if (this._modules.hasOwnProperty(moduleName)) {
				this._promises[moduleName] = () => this._Promise(moduleName);
			}
		}
	}

	/**
	 * @param {string} type
	 * @param {string} msg
	 * @param {...*} [data]
	 * @private
	 */
	_log (type, msg, ...data) {
		if (this._debug) {
			console[type](`ModuleDynamicImport ${type}: ${msg}`, ...data)
		}
	}
}

// ----------------------------------------
// Public
// ----------------------------------------

let instance = null;

const singleton = {
	/**
	 * @return {ModuleDynamicImport}
	 */
	instance () {
		console.log(888);
		if (instance === null) {
			console.log(999);
			singleton.create();
		}
		return instance;
	},

	/**
	 * @param {ModuleDynamicImportSettings} [settings]
	 * @return {ModuleDynamicImport}
	 */
	create (settings = {}) {
		console.log(777);
		if (instance instanceof ModuleDynamicImport) {
			console.warn('ModuleDynamicImport is already created');
			return instance;
		}
		instance = new ModuleDynamicImport(settings);
		return instance;
	}
};

export { singleton as ModuleDynamicImport }

// ----------------------------------------
// Definitions
// ----------------------------------------

/**
 * @typedef {Object} ModuleDynamicImportSettings
 * @property {Promise} [Promise=null]
 * @property {string} [selector='.js-import']
 * @property {Object} [modules={}]
 * @property {string} [pendingCssClass='_import-pending']
 * @property {string} [loadedCssClass='_import-loaded']
 * @property {boolean} [debug=false]
 */
