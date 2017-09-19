/**
* sequelize-i18n
*/

const utils = require('./utils');
const hooks = require('./hooks');
const instanceMethods = require('./instance-methods');
const _ = require('lodash');

/**
* @param {Object} options List of i18n options
* @param {Array} object.languages List of allowed languages
* @param {Object} object.default_language Default language
* @param {Boolean=true} object.i18n_default_scope Add i18n in the base
*				model default scope
* @param {Boolean=true} object.add_i18n_scope Add i18n scope in the base model
* @param {Boolean=true} object.add_i18n_scope Add i18n scope in the base model
* @param {Boolean=true} object.inject_i18n_scope Inject i18n scope in the base model
* @param {Boolean=true} object.default_language_fallback Fall back to default
* 				language if we can't find a value for the given language in get_i18n method
*/

/**
* Instantiate sequelize-i18n with a sequelize instance
* @name Sequelize_i18n
* @constructor
*
* @param {object} sequelize A sequelize instance
* @param {object} [options={}] List of i18n options
*/

class Sequelize_i18n {
	constructor(sequelize, options) {
		options = options || {};
		this.sequelize = sequelize;
		if (
			!(
				options.languages &&
				Array.isArray(options.languages) &&
				options.languages.length
			)
		)
			throw new Error('Languages list is mandatory and can not be empty.');
		this.languages = options.languages;
		if (
			options.default_language &&
			!this.isValidLanguage(options.default_language)
		)
			throw new Error('Default language is invalid.');
		this.default_language = options.default_language;
		this.primary_key = options.primary_key != null ? options.primary_key : null;
		this.default_language_fallback =
			options.default_language_fallback != null
				? options.default_language_fallback
				: true;
		// Add i18n scope in base model
		this.i18n_default_scope =
			options.i18n_default_scope != null ? options.i18n_default_scope : true;
		this.add_i18n_scope =
			options.add_i18n_scope != null ? options.add_i18n_scope : true;
		this.inject_i18n_scope =
			options.inject_i18n_scope != null ? options.inject_i18n_scope : true;
		this.language_type =
			sequelize.Sequelize[utils.getLanguageArrayType(options.languages)];
		this.i18n_models = [];
	}

	/**
	* Check if a language is valid( ie the given language is in the languages list)
	* @param {String} language The language to be validate
	* return {Boolean}
	*/
	isValidLanguage(language) {
		return this.languages.indexOf(language) >= 0;
	}

	/**
	* Get i18 model from the name of the base model
	* @param {String} modelName Name of the base model
	* @return {SequelizeModel}
	*/
	getI18nModel(modelName) {
		const model = _.filter(this.i18n_models, o => o.target.name === modelName);
		if (model && model.length) return model[0].base;
		return null;
	}

	/**
	* Create and define a new i18 model
	* @param {String} name i18n model name
	* @param {Object} attributes i18n model schema (See Sequelize define attributes parameter)
	* @param {Object} options i18n model options (See Sequelize define options parameter)
	* @param {String} baseModelName Base model name
	* @return {i18nAssociation}
	*/
	createI18nModel(name, attributes, options, baseModelName) {
		if (!attributes)
			throw new Error('Could not create i18n model without attributes.');
		this.sequelize.define(name, attributes, {
			indexes: options.indexes,
			timestamps: false,
			underscored: true
		});
		return {
			base: {
				name: name,
				defined: true,
				model: attributes
			},
			target: {
				name: baseModelName,
				defined: false
			}
		};
	}

	/**
	* Add i18n in base model default scope
	* @param {Object} defaultScope Base model default scope
	* @param {String} name Associated i18n model name
	* @return {Scope}
	*/
	setDefaultScope(defaultScope, name) {
		if (!name) return defaultScope;
		defaultScope.include = utils.toArray(defaultScope.include);
		defaultScope.include.push({
			model: this.sequelize.models[name],
			as: name
		});
	}

	/**
	* Inject i18n in base model user defined scopes
	* @param {Object} scopes Base model scopes
	* @param {String} name Associated i18n model name
	* @return {Scope}
	*/
	injectI18nScope(scopes, name) {
		for (var scope in scopes) {
			scopes[scope].include = utils.toArray(scopes[scope].include);
			scopes[scope].include.push({
				model: this.sequelize.models[name],
				as: name,
				attributes: {
					exclude: ['id', 'parent_id']
				}
			});
		}
	}

	/**
	* Add i18n in base model scopes
	* @param {Object} scopes Base model scopes
	* @param {String} name Associated i18n model name
	* @return {Scope}
	*/
	addI18nScope(scopes, name) {
		const model = this.sequelize.models[name];
		scopes.i18n = lang => {
			return {
				include: {
					model,
					as: name,
					attributes: {
						exclude: ['id', 'parent_id']
					}
				}
			};
		};
	}

	/**
	* Define model instance methods ( getter and setter )
	* @param {Object} modelProto Model prototype to attach instance methods
	* @param {String} i18nModelName Target i18n model name
	* @return {Undefined}
	*/
	setInstanceMethods(modelProto, i18nModelName) {
		modelProto.set_i18n = this.setSetter(i18nModelName);
		modelProto.get_i18n = this.setGetter(i18nModelName);
	}

	/**
	* Model hooks
	*/
	beforeDefine() {
		return hooks.beforeDefine.call(this);
	}

	afterDefine() {
		return hooks.afterDefine.call(this);
	}

	beforeFind() {
		return hooks.beforeFind.call(this);
	}

	afterCreate() {
		return hooks.afterCreate.call(this);
	}

	afterUpdate() {
		return hooks.afterUpdate.call(this);
	}

	afterDelete() {
		return hooks.afterDelete.call(this);
	}

	/**
	* setGetter method
	* Get i18n value for the given model name
	* @param {String} i18nModelName Target i18n model name
	*/
	setGetter(i18nModelName) {
		return instanceMethods.get_i18n(i18nModelName);
	}

	/**
	* setSetter method
	* Set i18n value for the given model name
	* @param {String} i18nModelName Target i18n model name
	*/
	setSetter(i18nModelName) {
		return instanceMethods.set_i18n(i18nModelName);
	}

	/**
	* Model initialization
	*/
	init() {
		this.beforeDefine();
		this.afterDefine();
	}

	/**
	* Get i18n table name from a base table name
	* @param {String} modelName Name of the base model
	* @return {String}
	*/
	static getI18nName(modelName) {
		return `${modelName}_i18n`;
	}
}

module.exports = Sequelize_i18n;
