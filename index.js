'use strict';

/**
 * @module
 */

// ----------------------------------------
// Imports
// ----------------------------------------

import $ from 'jquery';

// ----------------------------------------
// Private
// ----------------------------------------

class ModuleDynamicImport {
	/**
	 * @param {ModuleDynamicImportSettings} settings
	 */
	constructor (settings) {
		/** @private */
		this._PromiseFn = settings.PromiseFn || null;
		if (this._PromiseFn === null) {
			throw new Error('ModuleDynamicImport Error! You must specify "Promise" property!');
		}

		/**
		 * @private
		 */
		this._selector = settings.selector || '.js-import';

		/**
		 * @enum {ModuleDynamicImportModules}
		 * @private
		 */
		this._modules = settings.modules || {};

		/**
		 * @private
		 */
		this._pendingCssClass = settings.pendingCssClass || '_import-pending';

		/**
		 * @private
		 */
		this._loadedCssClass = settings.loadedCssClass || '_import-loaded';

		/**
		 * @private
		 */
		this._executedCssClass = settings.executedCssClass || '_import-executed';

		/**
		 * @private
		 */
		this._debug = settings.debug || false;
	}

	/**
	 * @param {string} moduleName
	 * @param {jQuery} [$container=$(document)]
	 * @return {Promise}
	 */
	importModule (moduleName, $container = $(document)) {
		if (!this._modules.hasOwnProperty(moduleName)) {
			this._log('warn', `module "${moduleName}" is not declared`);
			return Promise.reject();
		}

		const $elements = this._getElements($container);
		if (!$elements.length) {
			return Promise.resolve();
		}

		return this._import(moduleName, $elements, $container);
	}

	/**
	 * @param {jQuery} [$container=$(document)]
	 * @param {boolean} [awaitAll=true]
	 * @return {Promise}
	 */
	importAll ($container = $(document), awaitAll = true) {
		const $elements = this._getElements($container);
		if (!$elements.length) {
			return Promise.resolve();
		}

		const imports = [];
		for (let moduleName in this._modules) {
			if (this._modules.hasOwnProperty(moduleName)) {
				imports.push(this._import(moduleName, $elements, $container));
			}
		}

		if (awaitAll) {
			return Promise.all(imports);
		}
		return Promise.resolve();
	}

	/**
	 * @param {string} moduleName
	 * @return {Promise}
	 * @private
	 */
	_resolveWithErrors (moduleName) {
		console.warn(`ModuleDynamicImport WARN! Module "${moduleName}" resolved width errors!!!`);
		return Promise.resolve();
	}

	/**
	 * @param {string} moduleName
	 * @param {jQuery} $elements
	 * @param {jQuery} $container
	 * @return {Promise}
	 * @private
	 */
	_import (moduleName, $elements, $container) {
		/** @type ModuleDynamicImportModules */
		const module = this._modules[moduleName];
		if (!module.hasOwnProperty('__moduleName')) {
			module.__moduleName = moduleName;
		}
		if (module && module.moduleFile && module.filterSelector) {
			const $moduleElements = $elements.filter(module.filterSelector);
			if (!$moduleElements.length) {
				return Promise.resolve();
			}

			if (typeof module.importCondition === 'function' && module.__importConditionAllowed !== true) {
				const result = module.importCondition($moduleElements, $container);
				if (result === false) {
					this._log('info', `module "${moduleName}" skipped by ".importCondition()"`);
					return Promise.resolve();
				}
			}

			this._log('info', `module "${moduleName}" pending`);
			this._markAsPending($moduleElements);
			return this._PromiseFn(module.moduleFile)
				.then(importedModule => {
					if (typeof importedModule.default !== 'function') {
						this._log('warn', `imported module "${moduleName}" - must export default method`);
						return this._resolveWithErrors(moduleName);
					}
					this._markAsLoaded($moduleElements);
					this._log('info', `module "${moduleName}" executing`);
					importedModule.default($moduleElements);
					this._markAsExecuted($moduleElements);
				})
				.catch(err => {
					console.error(err);
					return this._resolveWithErrors(moduleName);
				});
		} else {
			this._log('warn', `${moduleName} is incorrect! it must have "moduleFile" and "filterSelector" properties`);
			return this._resolveWithErrors(moduleName);
		}
	}

	/**
	 * @param {jQuery} $container
	 * @return {jQuery} $container
	 * @private
	 */
	_getElements ($container) {
		const $elements = $container.find(this._selector);
		if (!$elements.length) {
			this._log('info', `No import elements with selector "${this._selector}"`);
		}
		return $elements;
	}

	/**
	 * @param {jQuery} $elements
	 * @private
	 */
	_markAsPending ($elements) {
		if (this._pendingCssClass) {
			$elements.addClass(this._pendingCssClass);
		}
		$elements.trigger(ModuleDynamicImport.eventPendingName);
	}

	/**
	 * @param {jQuery} $elements
	 * @private
	 */
	_markAsLoaded ($elements) {
		if (this._loadedCssClass) {
			$elements.addClass(this._loadedCssClass);
		}
		$elements.trigger(ModuleDynamicImport.eventLoadedName);
	}

	/**
	 * @param {jQuery} $elements
	 * @private
	 */
	_markAsExecuted ($elements) {
		if (this._executedCssClass) {
			$elements.addClass(this._executedCssClass);
		}
		$elements.trigger(ModuleDynamicImport.eventExecutedName);
	}

	/**
	 * @param {string} type
	 * @param {string} msg
	 * @param {...*} [data]
	 * @private
	 */
	_log (type, msg, ...data) {
		if (this._debug) {
			console[type](`ModuleDynamicImport ${type}: ${msg}`, ...data);
		}
	}

	/**
	 * @type {string}
	 */
	static get eventPendingName () {
		return 'moduleDynamicImportPending';
	}

	/**
	 * @type {string}
	 */
	static get eventLoadedName () {
		return 'moduleDynamicImportLoaded';
	}

	/**
	 * @type {string}
	 */
	static get eventExecutedName () {
		return 'moduleDynamicImportExecuted';
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
		if (instance === null) {
			singleton.create();
		}
		return instance;
	},

	/**
	 * @param {ModuleDynamicImportSettings} [settings]
	 * @return {ModuleDynamicImport}
	 */
	create (settings = {}) {
		if (instance instanceof ModuleDynamicImport) {
			instance._log('warn', 'ModuleDynamicImport is already created');
			return instance;
		}
		instance = new ModuleDynamicImport(settings);
		return instance;
	},

	/**
	 * @enum {string}
	 */
	events: {
		get pending () {
			return ModuleDynamicImport.eventPendingName;
		},
		get loaded () {
			return ModuleDynamicImport.eventLoadedName;
		},
		get executed () {
			return ModuleDynamicImport.eventExecutedName;
		}
	}

};

export { singleton as ModuleDynamicImport };

// ----------------------------------------
// Definitions
// ----------------------------------------

/**
 * @typedef {Object} ModuleDynamicImportSettings
 * @property {Function|Promise} [PromiseFn]
 * @property {string} [selector='.js-import']
 * @property {Object} [modules={}]
 * @property {string} [pendingCssClass='_import-pending']
 * @property {string} [loadedCssClass='_import-loaded']
 * @property {string} [executedCssClass='_import-executed']
 * @property {boolean} [debug=false]
 */

/**
 * @typedef {Object} ModuleDynamicImportModules
 * @property {string} moduleFile
 * @property {string} filterSelector
 * @property {Function} [importCondition]
 * @property {string} [__moduleName]
 * @property {boolean} [__importConditionAllowed]
 */
