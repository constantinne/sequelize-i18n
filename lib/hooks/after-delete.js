module.exports = function() {
	var self = this;

	return function(instance, options) {
		// Get Generated model
		var i18n_model = self.getI18nModel(this.name);
		if (i18n_model == null) return Promise.resolve();

		return self.sequelize.models[i18n_model.name]
			.destroy({
				where: {
					parent_id: instance.id
				}
			})
			.then(_instance => Promise.resolve())
			.catch(error => Promise.reject(error));
	};
};
