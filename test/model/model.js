const { Model } = require('sequelize');

const TestModel = (sequelize, DataTypes) => {
	class TestModel extends Model {}
	TestModel.init(
		{
			id: {
				type: DataTypes.BIGINT,
				primaryKey: true,
				autoIncrement: true
			},
			label: {
				type: DataTypes.STRING,
				i18n: true
			},
			reference: {
				type: DataTypes.STRING
			}
		},
		{ sequelize }
	);

	return TestModel;
};

module.exports = function(sequelize) {
	return sequelize.import('model', TestModel);
};
