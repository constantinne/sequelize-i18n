'use strict';

const should = require('chai').should();
const Sequelize = require('sequelize');
const utils = require('../lib/utils');
const Sequelize_i18n = require('../');
require('mocha');

const languages = {
	list: ['FR', 'EN', 'ES'],
	default: 'FR'
};

let sequelize;
let Model;
let i18n;
let instance;

describe('Utils methods', () => {
	it('should return the i18n model name', () => {
		Sequelize_i18n.getI18nName('TestModel').should.equal('TestModel_i18n');
	});

	it('toArray() of null should return an empty array', () => {
		const result = utils.toArray(null);
		Array.isArray(result).should.equal(true);
		result.length.should.equal(0);
	});

	it('toArray() of an empty array should return an empty array', () => {
		const result = utils.toArray([]);
		Array.isArray(result).should.equal(true);
		result.length.should.equal(0);
	});

	it('toArray() of an object should return an array containing the object at index 0', () => {
		const obj = 5;
		const result = utils.toArray(obj);
		Array.isArray(result).should.equal(true);
		result.length.should.equal(1);
		result[0].should.equal(obj);
	});

	it('getLanguageArrayType() of an array of strings should return "STRING" ', () => {
		const result = utils.getLanguageArrayType(['FR', 'EN']);
		result.should.equal('STRING');
	});

	it('getLanguageArrayType() of an array of numbers should return "INTEGER" ', () => {
		const result = utils.getLanguageArrayType([1, 2]);
		result.should.equal('INTEGER');
	});

	it('getLanguageArrayType() of an array of mixed object should return "STRING" ', () => {
		const result = utils.getLanguageArrayType(['1', 2]);
		result.should.equal('STRING');
	});
});

describe('Sequelize', () => {
	it('should be connected to database', () => {
		sequelize = new Sequelize('', '', '', {
			dialect: 'sqlite',
			//storage: 'database.test.sqlite',
			logging: false
		});

		sequelize
			.authenticate()
			.then(err => {
				console.log('\tConnection has been established successfully.');
			})
			.catch(err => {
				console.log('\tUnable to connect to the database:', err);
			});
	});

	it('should init i18n module', () => {
		i18n = new Sequelize_i18n(sequelize, {
			languages: languages.list,
			default_language: languages.default
		});
		i18n.init();
	});

	it('should add the given model', () => {
		Model = require('./model/model')(sequelize);
	});

	it('should have imported the exemple model', () => {
		sequelize.models.should.have.property('TestModel');
	});
});

describe('Sequelize-i18n', () => {
	it('i18n should have the correct languages list', () => {
		i18n.languages.length.should.equal(languages.list.length);
		for (let i = 0; i < languages.list.length; i++) {
			i18n.languages[i].should.equal(languages.list[i]);
		}
	});

	it('i18n should have "' + languages.default + '" as default language', () => {
		i18n.default_language.should.equal(languages.default);
	});

	it('should have created the model i18n table', () => {
		sequelize.models.should.have.property('TestModel_i18n');
	});

	it('should set i18n instance methods', () => {
		i18n.setInstanceMethods(
			Model.prototype,
			Sequelize_i18n.getI18nName(Model.name)
		);
		Model.prototype.get_i18n.should.be.a('function');
		Model.prototype.set_i18n.should.be.a('function');
	});

	it('should synchronize database', async done => {
		try {
			await sequelize.sync({ force: true });
			done();
		} catch (e) {
			done(e);
		}
	});

	it('should have a "TestModel" and "TestModel_i18ns" table', async done => {
		try {
			const result = await sequelize.showAllSchemas();
			result.should.not.equal(null);
			result.length.should.equal(2);
			result[0].should.equal('TestModels');
			result[1].should.equal('TestModel_i18ns');
			done();
		} catch (e) {
			done(e);
		}
	});
});

describe('Sequelize-i18n create', () => {
	it('should return the created model with the i18n property', async done => {
		try {
			const result = await Model.create({
				id: 1,
				label: 'test',
				reference: 'random'
			});
			if (result) {
				instance = result;
				done();
			}
		} catch (e) {
			done(e);
		}
	});
});

describe('Sequelize-i18n find', () => {
	it('should return i18n values after 30s', async done => {
		try {
			const result = await Model.findById(1);
			result.should.have.property('TestModel_i18n');
			result['TestModel_i18n'].length.should.equal(1);
			result['TestModel_i18n'][0].should.have.property('label');
			result['TestModel_i18n'][0]['label'].should.equal('test');
			done();
		} catch (e) {
			done(e);
		}
	});

	it('should return model values when filter on base fields', async done => {
		try {
			const result = await Model.findOne({ where: { reference: 'random' } });
			result.should.have.property('reference');
			result.reference.should.equal('random');
			done();
		} catch (e) {
			done(e);
		}
	});

	it('should return i18n values when filter on field i18n', async done => {
		try {
			const result = await Model.findOne({ where: { label: 'test' } });
			result.should.have.property('TestModel_i18n');
			result['TestModel_i18n'].length.should.equal(1);
			result['TestModel_i18n'][0].should.have.property('label');
			result['TestModel_i18n'][0]['label'].should.equal('test');
			done();
		} catch (e) {
			done(e);
		}
	});
});

describe('Sequelize-i18n update', () => {
	it('should set the name property to test2 for default language', () =>
		instance
			.update({ label: 'test-fr-update' }, { language_id: 'FR' })
			.then(res => {
				instance.get_i18n('FR').label.should.equal('test-fr-update');
			}));

	it('should set the name property to test-en-update for EN', () =>
		instance
			.update({ label: 'test-en-update' }, { language_id: 'EN' })
			.then(res =>
				Model.find({ where: { id: 1 } }).then(_result => {
					_result.get_i18n('EN').label.should.equal('test-en-update');
				})
			));
});

describe('Sequelize-i18n delete', () => {
	it('should delete current instance and its i18n values', () =>
		instance.destroy());
});
