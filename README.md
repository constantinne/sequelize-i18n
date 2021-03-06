# sequelize-i18n

> Easily set up internalization using [sequelize](https://github.com/sequelize/sequelize)


## Installation

Install with npm

```
npm install https://github.com/constantinne/sequelize-i18n --save
```


Install with yarn

```
yarn add https://github.com/constantinne/sequelize-i18n
```

## Usage


### Model definition

Define your models as usal using sequelize, simply set i18n property to true for the internationnalised fields :
```js

import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Course);
    }
  }
  Category.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      category: { type: DataTypes.STRING, i18n: true }
    },
    { sequelize }
  );

  return Category;
};

```


### Initialisation

Init Sequelize-i18n module before importing models

```js

import fs from "fs";
import path from "path";
import Sequelize from "sequelize";
import SequelizeI18N from "sequelize-i18n";
import configs from "../config/database";

const basename = path.basename(module.filename);
const env = process.env.NODE_ENV || "development";
const config = configs[env];
const db = {};
let sequelize = {};
const languages = {
  list: ["en", "fr", "md"],
  default: "en"
};

// Init Sequelize at the specifiv ENV

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}
// Init i18n
const i18n = new SequelizeI18N(sequelize, {
  languages: languages.list,
  default_language: languages.default
});

i18n.init();

// Import models in sequelize
fs
  .readdirSync(__dirname)
  .filter(
    file =>
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
  )
  .forEach(file => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });


Object.keys(db).forEach(modelName => {
  // Associate models in sequelize
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
  // Since v4.* instance and class methods was removed it need to manually define
  // instance methods get_i18n, set_i18n like:
  i18n.setInstanceMethods(db[modelName].prototype, i18n.getI18nName(modelName));
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db.sequelize.sync({ force: true });
// db.sequelize.sync();

export default db;

```

### Options

 - **languages** ( Array ) - List of allowed languages IDs
 - **default_language** ( Object ) - Default language ID
 - **i18n_default_scope** ( Boolean = true ) - Add i18n to the model default scope
 - **add_i18n_scope** ( Boolean = true ) - Add i18n scope to model
 - **inject_i18n_scope** ( Boolean = true ) - Inject i18n to model scopes
 - **default_language_fallback** ( Boolean = true ) - Fall back to default language if we can't find a value for the given language in get_i18n method

## How it works
----------

Sequelize-i18n will check for i18n property in your models properties.
If i18n is set to true, it will create an new table in which internationalized values for the property will be store.

Example :
The given the above exemple "Category",

    category : {
        type 		: DataTypes.STRING,
        i18n		: true,
    }

A Category_i18n Sequelize model will be create, with the following columns:

 - id : the row unique identifier ( INTEGER )
 - language_id : Identifies the language of the current translation ( INTEGER OR STRING )
 - parent_id : id of the targeted product  ( Same the Product model primary key or unique key )
 - name : i18n value ( Same as Category.name.type )

The "name" property type will be set to VIRTUAL

Sequelize-i18n will set hooks into models on create, find, update and delete operations.

### Creation

    CategoryModel.create({
         id: 1,
         name: 'test',
         reference: "xxx"
     })
     .then(function (result)  {
         // result.product_i18n == [ {name : "test" , lang : "FR" } ]
     })

### Update

    category_instance.update( { name : "new name" }  )
    .then( function( result ) {
	    // result.product_i18n = [ {name : "french name" , language_id : "FR" } ]
    }

    category_instance.update( { name : "english name" } , { language_id : "EN" }  )
    .then( function( result ) {
        /*
        result.product_i18n == [
	        {name : "french name" , language_id : "FR" } ,
	        {name : "english name" , language_id : "EN" }
        ]
        */
    }

### Find

    Category.find({ where : { id : 1 } })
    .then( function( result ) {
	    /*
        result.category_i18n == [
	        {name : "french name" , language_id : "FR" } ,
	        {name : "english name" , language_id : "EN" }
        ]
        */
    });

### Delete

Deleting a Product instance will also delete i18n values



### get_i18n instance method

An Sequelize instance method is added to the Sequelize model in order to set virtual i18n property in the lanuage you want.

    category_instance.get_i18n( "EN" );
    // category_instance.name == "english name"

    category_instance.get_i18n( "FR" );
    // category_instance.name == "french name"

    category_instance.get_i18n( "ES" );
    // category_instance.name == "" if options.default_language_fallback is set to false
    // category_instance.name == "french name" if options.default_language_fallback is set to true

### set_i18n instance method

An Sequelize instance method is added to the Sequelize model in order to set virtual i18n property in the lanuage you want.

    category_instance.set_i18n("fr", "category", "le francais nome");
