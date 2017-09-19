/**
* set_i18n method
* Set i18n value for the given property
* @param {String} lang language for given property
* @param {String} propertyName property name
* @param {String} value value for property
*/

module.exports = function(modelName) {
	var self = this;

	return function(lang, propertyName, value) {
		if (!lang && !self.default_language) throw new Error('No language given.');
		if (!propertyName) throw new Error('Property name to update is missing.');

		var current_object_id = this.id;
		var options = {
			parent_id: current_object_id,
			language_id: lang
		};

		options[propertyName] = value;

		return this.sequelize.models[modelName].upsert(options);
	};
};
