declare module 'module-dynamic-import' {
	export interface IModuleDynamicImportSettings {
		PromiseFn?(moduleFileName: string): Promise<any>;
		selector?: JQuery.Selector;
		modules?: { [p: string]: IModuleDynamicImportModules };
		pendingCssClass?: string;
		loadedCssClass?: string;
		executedCssClass?: string;
		debug?: boolean;
	}

	export interface IModuleDynamicImportEvents {
		pending: string;
		loaded: string;
		executed: string;
	}

	export interface IModuleDynamicImportModules {
		moduleFile: string;
		filterSelector: JQuery.Selector;
		importCondition?: IModuleDynamicImportConditionFn;
	}

	export interface IModuleDynamicImportModuleInstance
		extends IModuleDynamicImportModules {
		__moduleName: string;
		__importConditionAllowed: boolean;
	}

	export interface IModuleDynamicImportConditionFn {
		(
			this: IModuleDynamicImportModuleInstance,
			$elements: JQuery,
			$container: JQuery
		): boolean;
	}

	export class ModuleDynamicImport {
		importModule(moduleName: string, $container: JQuery): Promise<any>;
		importAll($container: JQuery, awaitAll: boolean): Promise<any>;
		static create(settings: IModuleDynamicImportSettings): ModuleDynamicImport;
		static instance(): ModuleDynamicImport;
		static get eventPendingName(): string;
		static get eventLoadedName(): string;
		static get eventExecutedName(): string;
	}
}
